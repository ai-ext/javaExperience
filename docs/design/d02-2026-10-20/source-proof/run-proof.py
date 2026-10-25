"""원문 Java와 추가 loopback DNS/TCP/TLS/proxy를 구분하는 재현용 관찰자."""
from pathlib import Path
import argparse, errno, hashlib, http.client, http.server, ipaddress, json, os
import re, shutil, socket, ssl, struct, subprocess, tempfile, threading, time, platform
from urllib.parse import urlsplit

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
JAVA=Path('LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
p=argparse.ArgumentParser();p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');args=p.parse_args()
runtime=Path(args.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
run=Path(tempfile.mkdtemp(prefix='run-',dir=runtime));os.chmod(run,0o700)
checks=[];facts={};resources=[];boot=None;boot_log=None
raw={'scope':'fresh loopback fixture only; no system DNS/hosts/trust/firewall changes'}

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def record(id,ok,value):
    if not ok:raise AssertionError(id)
    checks.append(id);facts[id]=json.loads(json.dumps(value))
    print('PASS '+id,flush=True)
def command(arguments,label):
    env=os.environ.copy();env.update(JAVA_HOME=str(JAVA),TZ='UTC',LC_ALL='C')
    r=subprocess.run(arguments,cwd=run,env=env,capture_output=True,text=True,timeout=120)
    (run/(label+'.log')).write_text(r.stdout+r.stderr)
    if r.returncode:raise AssertionError(label+' failed; private raw log')
    return r
def http_get(port,target):
    c=http.client.HTTPConnection('127.0.0.1',port,timeout=3)
    try:
        c.request('GET',target);r=c.getresponse();return r.status,r.read().decode()
    finally:c.close()
def start_server(server):
    thread=threading.Thread(target=server.serve_forever,kwargs={'poll_interval':.05},daemon=True);thread.start()
    resources.append((server,thread));return server.server_address[1]
def wire_name(name):return b''.join(bytes([len(x)])+x.encode('ascii')for x in name.split('.'))+b'\0'
def read_name(packet,offset):
    labels=[]
    while packet[offset]:
        size=packet[offset]
        if size&0xc0==0xc0:
            tail,_=read_name(packet,((size&0x3f)<<8)|packet[offset+1]);labels.append(tail);return '.'.join(labels),offset+2
        offset+=1;labels.append(packet[offset:offset+size].decode('ascii'));offset+=size
    return '.'.join(labels),offset+1

meta=json.loads((OUT/'source.json').read_text());assert sha(ROOT/meta['source'])==meta['sha256']
for b in meta['originalBlocks']:assert sha(OUT/'original'/b['file'])==b['sha256']
assert(OUT/'original/block-07.java').read_bytes()==(OUT/'fixture/java/com/example/ProbeApplication.java').read_bytes()
try:
    version=command([str(JAVA/'bin/java'),'-version'],'java-version');version_match=re.search(r'version \"([^\"]+)',version.stderr);assert version_match
    java_version=version_match.group(1);assert java_version=='21.0.6'
    raw.update(pythonVersion=platform.python_version(),pythonSSL=ssl.OPENSSL_VERSION,opensslCLI=command(['openssl','version'],'openssl-version').stdout.strip())
    project=run/'project';shutil.copytree(OUT/'fixture',project)
    command([str(ROOT/'gradlew'),'-p',str(project),'--offline','--no-daemon','--console=plain','recordRuntime'],'compile')
    shutil.copyfile(run/'compile.log',OUT/'compile.log')
    deps=json.loads((project/'dependencies.json').read_text())
    assert all(sha(x['file'])==x['sha256']for x in deps)
    (OUT/'dependencies.json').write_text(json.dumps(deps,indent=2)+'\n')
    boot_log=(run/'boot.log').open('w')
    boot=subprocess.Popen([str(JAVA/'bin/java'),'-cp',(project/'classpath.txt').read_text(),
        'com.example.ProbeApplication','--server.address=127.0.0.1','--server.port=0',
        '--spring.main.banner-mode=off'],cwd=run,stdout=boot_log,stderr=subprocess.STDOUT)
    deadline=time.monotonic()+40;port=None
    while time.monotonic()<deadline:
        log=(run/'boot.log').read_text()
        match=re.search(r'Tomcat started on port (\d+)',log)
        if match:port=int(match.group(1));break
        if boot.poll()is not None:raise AssertionError('source Boot process exited before ready')
        time.sleep(.05)
    assert port is not None
    raw.update(bootPid=boot.pid,bootPort=port,run=str(run))
    coords=[x['coordinate']for x in deps]
    record('source-java-unchanged-real-boot-loopback',
        'org.springframework.boot:spring-boot:4.1.1'in coords and any('tomcat-embed-core' in x for x in coords),
        {'sourceJavaByteExact':True,'javaVersion':java_version,'bootVersion':'4.1.1','boundAddress':'127.0.0.1',
         'scope':'source Java unchanged; extra Java21 Gradle/loopback port0 args, not source Java25/8080 setup'})
    status,body=http_get(port,'/probe')
    record('source-probe-real-tcp-200-ok',status==200 and body=='ok',{'status':status,'body':body,'path':'/probe'})
    status,_=http_get(port,'/not-mapped')
    record('source-missing-route-real-tcp-404',status==404,{'status':status,'path':'/not-mapped','scope':'HTTP reached this fixture; not DNS failure'})

    u=urlsplit('https://api.example.com:8443/orders/42?expand=items#history')
    record('extra-url-parts-are-separate',u.scheme=='https'and u.hostname=='api.example.com'and u.port==8443,
        {'scheme':u.scheme,'host':u.hostname,'port':u.port,'path':u.path,'query':u.query,'fragment':u.fragment,
         'scope':'Python URL parser; no request to example.com'})

    # 자체 소켓을 bind한 채 아직 listen하지 않으면 다른 서비스의 포트를 건드리지 않는다.
    with socket.socket()as listener:
        listener.bind(('127.0.0.1',0));testport=listener.getsockname()[1];failure=None
        try:socket.create_connection(('127.0.0.1',testport),timeout=1).close()
        except OSError as e:failure='timeout'if isinstance(e,socket.timeout)else errno.errorcode.get(e.errno,type(e).__name__)
        record('extra-bound-without-listen-no-tcp-connection',failure is not None,{'bound':True,'listening':False,'observedFailure':failure,'scope':'this OS/own bound socket; no universal refused-vs-timeout or firewall diagnosis'})
        listener.listen(1)
        with socket.create_connection(('127.0.0.1',testport),timeout=1)as client:
            accepted,_=listener.accept();accepted.close()
        record('extra-listen-accepts-tcp-not-http',True,{'tcpConnected':True,'httpResponseObserved':False,'scope':'same own socket after listen; no HTTP handler'})
    with socket.socket()as silent:
        silent.bind(('127.0.0.1',0));silent.listen(1)
        with socket.create_connection(silent.getsockname(),timeout=1)as client:
            accepted,_=silent.accept()
            try:
                client.settimeout(.2);timed_out=False
                try:client.recv(1)
                except socket.timeout:timed_out=True
                record('extra-connected-read-deadline-not-firewall-proof',timed_out,
                    {'tcpConnected':True,'applicationSentBytes':0,'readDeadlineReached':True,
                     'configuredReadDeadlineSeconds':.2,'scope':'server deliberately silent; no latency or packet-loss measurement'})
            finally:accepted.close()

    # 로컬 권한 DNS 역할만 흉내 낸 고정 응답 UDP fixture다. 시스템 resolver를 쓰지 않는다.
    dns_socket=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);dns_socket.bind(('127.0.0.1',0));dns_socket.settimeout(.05)
    stop_dns=threading.Event();dns_requests=[]
    def dns_worker():
        while not stop_dns.is_set():
            try:packet,peer=dns_socket.recvfrom(2048)
            except socket.timeout:continue
            except OSError:return
            name,end=read_name(packet,12);kind,cls=struct.unpack('!HH',packet[end:end+4]);question=packet[12:end+4]
            rcode=3 if name=='missing.d02.test'else 2 if name=='broken.d02.test'else 0
            data=None
            if not rcode:
                if kind==1:data=ipaddress.ip_address('203.0.113.10').packed
                elif kind==28:data=ipaddress.ip_address('2001:db8::10').packed
                elif kind==5:data=wire_name('origin.d02.test')
            answer=b''if data is None else b'\xc0\x0c'+struct.pack('!HHIH',kind,cls,60,len(data))+data
            response=packet[:2]+struct.pack('!HHHHH',0x8400|rcode,1,int(data is not None),0,0)+question+answer
            dns_requests.append({'name':name,'type':kind,'rcode':rcode});dns_socket.sendto(response,peer)
    dns_thread=threading.Thread(target=dns_worker,daemon=True);dns_thread.start()
    try:
        def query(name,kind):
            packet=struct.pack('!HHHHHH',42,0,1,0,0,0)+wire_name(name)+struct.pack('!HH',kind,1)
            with socket.socket(socket.AF_INET,socket.SOCK_DGRAM)as c:
                c.settimeout(2);c.sendto(packet,dns_socket.getsockname());response,_=c.recvfrom(2048)
            header=struct.unpack('!HHHHHH',response[:12]);_,end=read_name(response,12);offset=end+4
            value=None;ttl=None
            if header[3]:
                _,offset=read_name(response,offset);rtype,rclass,ttl,length=struct.unpack('!HHIH',response[offset:offset+10]);offset+=10
                value=read_name(response,offset)[0]if rtype==5 else str(ipaddress.ip_address(response[offset:offset+length]))
            return {'rcode':header[1]&15,'answers':header[3],'value':value,'ttl':ttl}
        answers={name:query(host,kind)for name,host,kind in [('A','api.d02.test',1),('AAAA','api.d02.test',28),('CNAME','alias.d02.test',5),('NXDOMAIN','missing.d02.test',1),('SERVFAIL','broken.d02.test',1)]}
        record('extra-dns-udp-address-records',answers['A']['value']=='203.0.113.10'and answers['AAAA']['value']=='2001:db8::10',
            {'A':answers['A'],'AAAA':answers['AAAA'],'scope':'local fixed UDP DNS fixture; documentation IPs, not real resolver or HTTP health'})
        record('extra-dns-cname-is-name-answer',answers['CNAME']['value']=='origin.d02.test',
            {'CNAME':answers['CNAME'],'httpRedirectExecuted':False,'scope':'DNS packet only; no HTTP connection to alias/target'})
        record('extra-dns-negative-rcodes-differ',answers['NXDOMAIN']['rcode']==3 and answers['SERVFAIL']['rcode']==2,
            {'NXDOMAIN':answers['NXDOMAIN'],'SERVFAIL':answers['SERVFAIL'],'scope':'two intentionally fixed fixture responses; no external DNS failure'})
    finally:stop_dns.set();dns_thread.join(1);dns_socket.close();assert not dns_thread.is_alive()

    # 매회 새 CA·키이며 이 과정에서만 읽는다. OS/브라우저 truststore에는 넣지 않는다.
    old_umask=os.umask(0o077)
    try:
        command(['openssl','req','-x509','-newkey','rsa:2048','-noenc','-keyout','ca.key','-out','ca.pem','-subj','/CN=D02-Demo-CA','-days','1','-addext','basicConstraints=critical,CA:TRUE','-addext','keyUsage=critical,keyCertSign,cRLSign'],'ca')
        command(['openssl','req','-new','-newkey','rsa:2048','-noenc','-keyout','server.key','-out','server.csr','-subj','/CN=d02.test'],'csr')
        (run/'san.cnf').write_text('subjectAltName=DNS:d02.test,IP:127.0.0.1\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectKeyIdentifier=hash\nauthorityKeyIdentifier=keyid,issuer\n')
        command(['openssl','x509','-req','-in','server.csr','-CA','ca.pem','-CAkey','ca.key','-CAcreateserial','-out','server.pem','-days','1','-extfile','san.cnf'],'certificate')
    finally:os.umask(old_umask)
    assert all((run/key).stat().st_mode&0o777==0o600 for key in ['ca.key','server.key'])
    proxy_requests=[];sni=[]
    class Proxy(http.server.BaseHTTPRequestHandler):
        protocol_version='HTTP/1.1'
        def do_GET(self):
            rewrite=self.headers.get('X-D02-Rewrite','on')=='on'
            target=self.path[4:]if rewrite and self.path.startswith('/api/')else self.path
            status,body=http_get(port,target);payload=body.encode()
            proxy_requests.append({'incoming':self.path,'host':self.headers.get('Host'),'upstream':target,'status':status})
            self.send_response(status);self.send_header('Content-Length',str(len(payload)));self.send_header('Connection','close');self.end_headers();self.wfile.write(payload)
        def log_message(self,*ignored):pass
    proxy=http.server.ThreadingHTTPServer(('127.0.0.1',0),Proxy)
    server_context=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);server_context.minimum_version=ssl.TLSVersion.TLSv1_2
    server_context.load_cert_chain(run/'server.pem',run/'server.key');server_context.set_servername_callback(lambda sock,name,ctx:sni.append(name))
    proxy.socket=server_context.wrap_socket(proxy.socket,server_side=True);proxyport=start_server(proxy)
    trusted=ssl.create_default_context(cafile=str(run/'ca.pem'))
    def https_get(host,target,context=trusted,rewrite=True):
        with socket.create_connection(('127.0.0.1',proxyport),timeout=3)as tcp:
            with context.wrap_socket(tcp,server_hostname=host)as tls:
                raw['negotiatedTLS']=tls.version()
                request=f'GET {target} HTTP/1.1\r\nHost: {host}\r\nX-D02-Rewrite: {"on"if rewrite else"off"}\r\nConnection: close\r\n\r\n'
                tls.sendall(request.encode());response=http.client.HTTPResponse(tls);response.begin();return response.status,response.read().decode()
    target_url=urlsplit(f'https://d02.test:{proxyport}/api/probe?expand=items#history')
    target=target_url.path+('?'+target_url.query if target_url.query else '')
    status,body=https_get('d02.test',target)
    record('extra-client-fragment-not-sent-over-http',proxy_requests[-1]['incoming']=='/api/probe?expand=items'and'#'not in proxy_requests[-1]['incoming'],
        {'clientFragment':target_url.fragment,'observedRequestTarget':proxy_requests[-1]['incoming'],'scope':'additional Python client serializer and actual loopback TLS request, not browser capture'})
    record('extra-tls-valid-chain-name-and-sni',status==200 and body=='ok'and'd02.test'in sni,
        {'certificateAccepted':True,'hostname':'d02.test','sniObserved':'d02.test','scope':'fresh demo CA trusted only by this client context; no system trust change'})
    record('extra-tls-termination-http-upstream-rewrite',proxy_requests[-1]['upstream']=='/probe?expand=items',
        {'front':'TLS','upstream':'HTTP','request':proxy_requests[-1],'body':body,'scope':'extra Python proxy to source Boot; not Nginx or production LB'})
    status,_=https_get('d02.test','/api/probe',rewrite=False)
    record('extra-no-rewrite-reaches-source-404',status==404 and proxy_requests[-1]['upstream']=='/api/probe',
        {'rewrite':False,'request':proxy_requests[-1],'scope':'same proxy/source app; HTTP404 not a TLS or DNS error'})
    before=len(proxy_requests)
    for id,host,ctx in [('extra-tls-wrong-name-rejected','wrong.d02.test',trusted),('extra-tls-untrusted-ca-rejected','d02.test',ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT))]:
        rejected=False
        try:https_get(host,'/api/probe',context=ctx)
        except ssl.SSLCertVerificationError:rejected=True
        record(id,rejected and len(proxy_requests)==before,{'certificateVerificationRejected':True,'httpHandlerCallsAdded':len(proxy_requests)-before,'scope':'verification remains enabled; no HTTP after failed certificate validation'})
    raw['proxyRequests']=proxy_requests;raw['sni']=sni;raw['dnsRequests']=dns_requests
finally:
    for server,thread in reversed(resources):server.shutdown();server.server_close();thread.join(2)
    if boot is not None:
        if boot.poll()is None:boot.terminate()
        try:boot.wait(timeout=15)
        except subprocess.TimeoutExpired:boot.kill();boot.wait(timeout=5)
    if boot_log:boot_log.close()
    if(run/'boot.log').exists():shutil.copyfile(run/'boot.log',OUT/'boot.log')
    (OUT/'runtime-last.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')

closed=False
try:socket.create_connection(('127.0.0.1',port),timeout=1).close()
except OSError:closed=True
record('private-boot-and-proxy-resources-closed',boot.poll()is not None and closed and all(not t.is_alive()for s,t in resources),
    {'bootProcessEnded':True,'bootPortClosed':True,'proxyThreadsEnded':True,'dnsThreadEnded':True,'scope':'own resources only; no global process/service commands'})
cache_expires=None;cache_hits=[];cache_queries=0
for model_now in [0,30,60]:
    hit=cache_expires is not None and model_now<cache_expires
    cache_hits.append(hit)
    if not hit:cache_queries+=1;cache_expires=model_now+60
assert cache_hits==[False,True,False]and cache_queries==2
models={
 'dns-cache':{'kind':'added fixed-clock cache model','ttl':60,'times':[0,30,60],'hit':cache_hits,'queries':cache_queries,'scope':'not OS/browser/recursive resolver cache observation'},
 'bind-and-route':{'kind':'source-derived concept','loopback':'127.0.0.1','wildcardIPv4':'0.0.0.0','externalReachabilityProven':False,'scope':'no wildcard bind or external/firewall/NAT route experiment'},
 'transport-and-trust':{'kind':'source-derived concept','http1and2':'TCP','http3':'QUIC/UDP','forwardedHeaderTrustedWithoutBoundary':False,'scope':'no QUIC/packet handshake capture/L4 or L7 product/forwarded trust enforcement executed'}
}
observed={'checks':sorted(checks),'facts':facts,'models':models}
(OUT/'execution.json').write_text(json.dumps(observed,ensure_ascii=False,indent=2)+'\n')
frozen=OUT/'checkpoints/expected-execution.json';frozen.parent.mkdir(exist_ok=True)
if args.freeze:frozen.write_text(json.dumps(observed,ensure_ascii=False,indent=2)+'\n')
else:assert observed==json.loads(frozen.read_text()),'frozen mismatch; investigate before re-freezing'
print(json.dumps({'checks':len(checks),'models':len(models),'frozenMatch':not args.freeze}),flush=True)
