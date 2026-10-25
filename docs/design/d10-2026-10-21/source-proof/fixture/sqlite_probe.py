"""명시 번역한 별도 SQLite 예시. PostgreSQL/MySQL 원문 실행이 아니다."""
from pathlib import Path
import collections
import datetime
import json
import sqlite3
import sys

FIXTURE = Path(__file__).resolve().parent
RUN = Path(sys.argv[1]).resolve()
SEEDS = json.loads((FIXTURE/'seeds.json').read_text())
checks, facts, connections = [], {}, {}
raw = {'engine':'SQLite','sqliteVersion':sqlite3.sqlite_version,'run':str(RUN),'connections':{},'statements':[],'sqliteTrace':[],'timeline':[]}
phase = 'setup'

def write_json(path, value):
    Path(path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def check(name, predicate, fact):
    if name in facts:
        raise AssertionError('duplicate CHECK '+name)
    if not predicate:
        raw['failedObservation']={'id':name,'fact':fact}
        raise AssertionError(name)
    checks.append(name);facts[name]=fact
    print('PASS '+name,flush=True)

def connection(alias, filename, shared=False):
    path=(RUN/filename).resolve();assert path.is_relative_to(RUN)
    if shared:assert path==(RUN/'wal-concurrency.sqlite').resolve() and 'writer' in connections
    else:assert not path.exists()
    conn=sqlite3.connect(path,isolation_level=None,timeout=0,cached_statements=0)
    connections[alias]=conn
    raw['connections'][alias]={'dbFile':str(path),'timeoutSeconds':0,'cachedStatements':0,'isolationLevel':None,'closed':False}
    conn.set_trace_callback(lambda sql:raw['sqliteTrace'].append({'phase':phase,'connection':alias,'dbFile':str(path),'sql':sql}))
    execute(alias,'PRAGMA foreign_keys=ON')
    assert fetch(alias,'PRAGMA foreign_keys')==[[1]]
    return conn

def execute(alias, sql, params=()):
    event={'sequence':len(raw['statements'])+1,'phase':phase,'connection':alias,'dbFile':raw['connections'][alias]['dbFile'],'sql':sql,'bindings':list(params)}
    try:
        cursor=connections[alias].execute(sql,params)
        event['sqliteCursorRowcount']=cursor.rowcount;raw['statements'].append(event)
        return cursor
    except sqlite3.Error as error:
        event['error']={'name':getattr(error,'sqlite_errorname',None),'code':getattr(error,'sqlite_errorcode',None),'message':str(error)}
        raw['statements'].append(event)
        raise

def fetch(alias,sql,params=()):
    cursor=execute(alias,sql,params);rows=[list(row) for row in cursor.fetchall()]
    raw['statements'][-1]['fetchedRows']=rows
    return rows

def script(alias,filename):
    sql=(FIXTURE/filename).read_text()
    raw['statements'].append({'sequence':len(raw['statements'])+1,'phase':phase,'connection':alias,'dbFile':raw['connections'][alias]['dbFile'],'scriptFile':filename,'sql':sql})
    connections[alias].executescript(sql)

def snapshot_college():
    return {name:fetch('college','SELECT * FROM '+name+' ORDER BY 1,2') for name in ['student','course','offering','enrollment']}

def rejection(label,sql,params):
    execute('college','SAVEPOINT constraint_trial')
    try:
        execute('college',sql,params)
        result={'case':label,'rejected':False,'sql':sql,'bindings':list(params)}
    except sqlite3.IntegrityError as error:
        result={'case':label,'rejected':True,'sql':sql,'bindings':list(params),'sqliteErrorName':error.sqlite_errorname,'sqliteErrorCode':error.sqlite_errorcode,'message':str(error)}
    finally:
        execute('college','ROLLBACK TO constraint_trial');execute('college','RELEASE constraint_trial')
    return result

def marker(name,**values):
    raw['timeline'].append({'sequence':len(raw['timeline'])+1,'marker':name,'phase':phase,'actualTimestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'values':values,'transactionStates':{key:conn.in_transaction for key,conn in connections.items()}})

try:
    check('additional-sqlite-runtime-boundary',sys.version.split()[0]=='3.14.3' and sqlite3.sqlite_version=='3.53.0',
          {'python':sys.version.split()[0],'sqlite':sqlite3.sqlite_version,'sqliteOnly':True,'postgresqlMySQLDockerJava25Executed':False,'originalCommandsExecuted':False,'networkOrExistingServiceAccess':False,'scope':'explicitly translated additional own-file SQLite examples, not source PostgreSQL DDL/isolation/EXPLAIN certification'})
    connection('college','college.sqlite');script('college','college-sqlite.sql')
    phase='college-seed'
    for row in SEEDS['college']['students']:execute('college','INSERT INTO student VALUES(?,?,?,?)',row)
    for row in SEEDS['college']['courses']:execute('college','INSERT INTO course VALUES(?,?,?)',row)
    for row in SEEDS['college']['offerings']:execute('college','INSERT INTO offering VALUES(?,?,?,?)',row)
    for row in SEEDS['college']['enrollments']:execute('college','INSERT INTO enrollment VALUES(?,?,?,?)',row)
    baseline=snapshot_college()
    check('college-four-relations-fixed-seed', [len(baseline[name]) for name in ['student','course','offering','enrollment']]==[2,1,2,1],
          {'rows':baseline,'counts':{key:len(value) for key,value in baseline.items()},'enrollmentIdentity':['student_id','offering_id'],'businessKeySeparateFromSurrogate':True,'scope':'additional fixed seed; not practice data or PostgreSQL original seed'})
    phase='college-constraint-rejections'
    rows=[rejection('student-pk','INSERT INTO student VALUES(?,?,?,?)',(1,'CAMPUS-003','student-c@example.test','학생C')),
          rejection('student-campus-uk','INSERT INTO student VALUES(?,?,?,?)',(3,'CAMPUS-001','student-c@example.test','학생C')),
          rejection('student-email-uk','INSERT INTO student VALUES(?,?,?,?)',(3,'CAMPUS-003','student-a@example.test','학생C'))]
    check('surrogate-pk-and-two-business-unique-keys',all(row['rejected'] for row in rows) and [row['sqliteErrorCode'] for row in rows]==[1555,2067,2067],
          {'attempts':rows,'scope':'SQLite duplicate PK/campus_no/email checks; surrogate id alone does not enforce business uniqueness'})
    rows=[rejection('student-name-not-null','INSERT INTO student VALUES(?,?,?,?)',(3,'CAMPUS-003','student-c@example.test',None)),
          rejection('enrollment-time-not-null','INSERT INTO enrollment VALUES(?,?,?,?)',(2,11,None,'ENROLLED'))]
    check('required-column-not-null-rejections',all(row['rejected'] and row['sqliteErrorCode']==1299 for row in rows),{'attempts':rows,'scope':'these tested required columns only; no claim of all SQLite/PG type equivalence'})
    rows=[rejection('course-code-uk','INSERT INTO course VALUES(?,?,?)',(2,'DB101','Other title')),
          rejection('offering-three-column-uk','INSERT INTO offering VALUES(?,?,?,?)',(12,1,'2026-FALL',1)),
          rejection('offering-missing-course','INSERT INTO offering VALUES(?,?,?,?)',(12,999,'2026-FALL',3)),
          rejection('offering-section-zero','INSERT INTO offering VALUES(?,?,?,?)',(12,1,'2026-FALL',0))]
    check('course-and-offering-business-rules',all(row['rejected'] for row in rows) and [row['sqliteErrorCode'] for row in rows]==[2067,2067,787,275],{'attempts':rows,'offeringUniqueColumns':['course_id','term_code','section_no']})
    rows=[rejection('enrollment-duplicate-pair','INSERT INTO enrollment VALUES(?,?,?,?)',(1,10,'2026-09-02T09:00:00Z','ENROLLED')),
          rejection('enrollment-missing-student','INSERT INTO enrollment VALUES(?,?,?,?)',(999,10,'2026-09-02T09:00:00Z','ENROLLED')),
          rejection('enrollment-missing-offering','INSERT INTO enrollment VALUES(?,?,?,?)',(2,999,'2026-09-02T09:00:00Z','ENROLLED')),
          rejection('enrollment-bad-status','INSERT INTO enrollment VALUES(?,?,?,?)',(2,11,'2026-09-02T09:00:00Z','WAITING'))]
    check('enrollment-pair-fk-and-status-checks',all(row['rejected'] for row in rows) and [row['sqliteErrorCode'] for row in rows]==[1555,787,787,275],{'attempts':rows,'scope':'same student/offering pair once; missing parent and tested bad status rejected'})
    preserved=snapshot_college()
    check('rejected-writes-preserve-college-seed',preserved==baseline,{'before':baseline,'after':preserved,'unchanged':True,'trialRollbackSafety':True})
    phase='separate-nullable-unique-toy'
    execute('college','CREATE TABLE nullable_unique(id INTEGER PRIMARY KEY, token TEXT UNIQUE)')
    execute('college','CREATE TABLE required_unique(id INTEGER PRIMARY KEY, token TEXT NOT NULL UNIQUE)')
    execute('college','INSERT INTO nullable_unique VALUES(1,NULL)');execute('college','INSERT INTO nullable_unique VALUES(2,NULL)')
    execute('college','INSERT INTO required_unique VALUES(1,?)',('alpha',))
    null_error=rejection('required-unique-null','INSERT INTO required_unique VALUES(?,?)',(2,None))
    duplicate_error=rejection('required-unique-duplicate','INSERT INTO required_unique VALUES(?,?)',(2,'alpha'))
    nullable_rows=fetch('college','SELECT * FROM nullable_unique ORDER BY id');required_rows=fetch('college','SELECT * FROM required_unique ORDER BY id')
    check('nullable-unique-versus-required-unique-toy',nullable_rows==[[1,None],[2,None]] and required_rows==[[1,'alpha']] and null_error['sqliteErrorCode']==1299 and duplicate_error['sqliteErrorCode']==2067,
          {'nullableRows':nullable_rows,'requiredRows':required_rows,'nullRejection':null_error,'duplicateRejection':duplicate_error,'scope':'separate SQLite3.53 toy, not student keys and not a cross-product NULL uniqueness rule'})
    phase='commerce-seed'
    connection('commerce','commerce.sqlite');script('commerce','commerce-sqlite.sql')
    for row in SEEDS['commerce']['customers']:execute('commerce','INSERT INTO customers VALUES(?,?,?)',row)
    for row in SEEDS['commerce']['orders']:execute('commerce','INSERT INTO orders VALUES(?,?,?,?,?)',row)
    customers=fetch('commerce','SELECT * FROM customers ORDER BY id');orders=fetch('commerce','SELECT * FROM orders ORDER BY id')
    check('independent-customer-order-seed',customers==SEEDS['commerce']['customers'] and orders==SEEDS['commerce']['orders'],{'customers':customers,'orders':orders,'scope':'independent additional SQLite fixed ISO seed; original TIMESTAMPTZ/DATE arithmetic and DECIMAL precision unrun'})
    phase='commerce-query-variants'
    cutoff=SEEDS['commerce']['customerCutoff']
    on=fetch('commerce',(FIXTURE/'left-on-paid.sql').read_text(),(cutoff,))
    check('additional-left-on-intermediate-counts',on==[[1,'ada@example.test',2,2,200],[2,'bob@example.test',1,0,0],[3,'cy@example.test',1,0,0]],
          {'rows':on,'columns':['id','email','count_star','order_count','paid_total'],'cutoff':cutoff,'scope':'additional intermediate/query variant: original HAVING removed and COUNT(*) added; unmatched customers remain; not original final HAVING result'})
    where=fetch('commerce',(FIXTURE/'where-paid.sql').read_text(),(cutoff,))
    check('right-paid-where-removes-unmatched-customers',where==[[1,'ada@example.test',2,2,200]],{'rows':where,'scope':'additional SQLite comparison variant; moving right PAID condition to WHERE removes null-extended rows'})
    having=fetch('commerce',(FIXTURE/'having-paid.sql').read_text(),(cutoff,))
    check('translated-final-having-keeps-paid-customer-only',having==[[1,'ada@example.test',2,200]],{'rows':having,'columns':['id','email','order_count','paid_total'],'scope':'SQLite translation of original final HAVING>=1 query; customer1 only; fixed ISO bind replaces PostgreSQL DATE literal'})
    recent=fetch('commerce',(FIXTURE/'exists-recent.sql').read_text(),(SEEDS['commerce']['recentOrderCutoff'],))
    check('translated-exists-has-no-status-filter',recent==[[1,'ada@example.test'],[2,'bob@example.test']],{'rows':recent,'cutoff':SEEDS['commerce']['recentOrderCutoff'],'statusPredicatePresent':False,'observerIDOrderAdded':True,'scope':'SQLite fixed ISO comparison; customer2 qualifies via CANCELLED order; no PostgreSQL timestamp arithmetic executed'})
    phase='commerce-guarded-write-501'
    execute('commerce','INSERT INTO orders VALUES(?,?,?,?,?)',SEEDS['commerce']['write501'])
    first=execute('commerce',"UPDATE orders SET status='PAID' WHERE id=501 AND status='PENDING'").rowcount
    second=execute('commerce',"UPDATE orders SET status='PAID' WHERE id=501 AND status='PENDING'").rowcount
    deleted=execute('commerce',"DELETE FROM orders WHERE id=501 AND status='CANCELLED'").rowcount
    row501=fetch('commerce','SELECT * FROM orders WHERE id=501')
    check('guarded-write-501-one-zero-zero-and-paid-row',first==1 and second==0 and deleted==0 and row501==[[501,1,'PAID',25000,'2026-10-01T12:00:00Z']],{'updateRowcounts':[first,second],'deleteRowcount':deleted,'row501':row501,'scope':'additional SQLite translation; explicit fixed ISO replaces source CURRENT_TIMESTAMP; SQLite cursor rowcounts, not MySQL affected-row mode'})
    phase='wal-setup'
    connection('writer','wal-concurrency.sqlite');assert fetch('writer','PRAGMA journal_mode=WAL')==[['wal']]
    connection('observer','wal-concurrency.sqlite',shared=True)
    execute('writer','CREATE TABLE state(id INTEGER PRIMARY KEY, value INTEGER NOT NULL)');execute('writer','INSERT INTO state VALUES(1,10)')
    execute('writer','CREATE TABLE stock(id INTEGER PRIMARY KEY, quantity INTEGER NOT NULL CHECK(quantity>=0))');execute('writer','INSERT INTO stock VALUES(1,5)')
    modes={alias:fetch(alias,'PRAGMA journal_mode')[0][0] for alias in ['writer','observer']}
    phase='wal-uncommitted-visibility'
    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=20 WHERE id=1')
    writer20=fetch('writer','SELECT value FROM state WHERE id=1')[0][0];observer10=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]
    marker('writer-uncommitted20-observer-old10',writer=writer20,observer=observer10)
    check('sqlite-wal-uncommitted-change-hidden',writer20==20 and observer10==10 and modes=={'writer':'wal','observer':'wal'}, {'journalModes':modes,'sameOwnDatabaseFile':True,'writerUncommittedValue':writer20,'otherConnectionValue':observer10,'scope':'controlled two-connection SQLite WAL case, not PostgreSQL/MySQL isolation or row-lock certification'})
    execute('writer','COMMIT');after_commit=fetch('observer','SELECT value FROM state WHERE id=1')[0][0];marker('commit-then-new-autocommit-read',observer=after_commit)
    check('sqlite-wal-commit-visible-to-new-read',after_commit==20,{'otherConnectionNewRead':after_commit,'previousUncommittedRead':10,'writerCommitCompleted':True})
    phase='wal-read-snapshot'
    execute('observer','BEGIN');snapshot_first=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]
    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=30 WHERE id=1');execute('writer','COMMIT')
    snapshot_again=fetch('observer','SELECT value FROM state WHERE id=1')[0][0];marker('reader-snapshot-after-writer-commit30',reader=snapshot_again,writerCommitted=30)
    execute('observer','COMMIT');new_read=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]
    check('sqlite-wal-read-snapshot-until-transaction-end',[snapshot_first,snapshot_again,new_read]==[20,20,30],{'readerFirst':snapshot_first,'readerAfterOtherCommit':snapshot_again,'readerAfterTransactionEndNewRead':new_read,'scope':'SQLite WAL read snapshot only; no PostgreSQL READ COMMITTED/InnoDB REPEATABLE READ execution'})
    phase='wal-two-writer-busy'
    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=40 WHERE id=1')
    try:
        execute('observer','BEGIN IMMEDIATE');busy=None
    except sqlite3.OperationalError as error:
        busy={'name':error.sqlite_errorname,'code':error.sqlite_errorcode,'message':str(error)}
    held_writer=fetch('writer','SELECT value FROM state WHERE id=1')[0][0];other_old=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]
    marker('first-writer-held-second-busy',writer=held_writer,other=other_old,error=busy)
    check('sqlite-begin-immediate-writer-contention-busy',busy is not None and busy['name']=='SQLITE_BUSY' and busy['code']==5 and held_writer==40 and other_old==30,
          {'secondWriterError':busy,'timeoutSeconds':0,'writerUncommittedValue':held_writer,'otherConnectionRead':other_old,'scope':'SQLite single-writer contention, not a row lock, PostgreSQL deadlock or waiting-time measurement'})
    execute('writer','ROLLBACK');rolled_back=[fetch(alias,'SELECT value FROM state WHERE id=1')[0][0] for alias in ['writer','observer']]
    check('sqlite-rollback-preserves-previous-state',rolled_back==[30,30],{'writerObserverAfterRollback':rolled_back,'uncommitted40Persisted':False})
    phase='guarded-stock-update'
    execute('writer','BEGIN IMMEDIATE')
    stock_first=execute('writer','UPDATE stock SET quantity=quantity-? WHERE id=? AND quantity>=?',(3,1,3)).rowcount
    stock_second=execute('writer','UPDATE stock SET quantity=quantity-? WHERE id=? AND quantity>=?',(3,1,3)).rowcount
    execute('writer','COMMIT');stock=fetch('observer','SELECT quantity FROM stock WHERE id=1')[0][0]
    check('guarded-stock-update-one-then-zero',stock_first==1 and stock_second==0 and stock==2,{'initialStock':5,'requestedQuantityEach':3,'rowcounts':[stock_first,stock_second],'finalOtherConnectionQuantity':stock,'scope':'two sequential guarded statements in own writer transaction; not a concurrent load/oversell proof'})
    phase='eqp-disposable-seed'
    connection('plans','plan.sqlite');execute('plans','CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, total_amount NUMERIC NOT NULL, created_at TEXT NOT NULL)')
    plan_seed=SEEDS['plan']
    for i in range(plan_seed['rows']):
        execute('plans','INSERT INTO orders VALUES(?,?,?,?,?)',(1000+i,1+i%plan_seed['customerModulo'],'PENDING' if i%3==0 else 'PAID',i%100,f"2026-09-{1+i%plan_seed['dayModulo']:02d}T00:00:00Z"))
    sql=(FIXTURE/'plan-query.sql').read_text();params=(plan_seed['queryCustomer'],plan_seed['queryCutoff'])
    def plan_state(label):
        result=fetch('plans',sql,params);eqp=fetch('plans','EXPLAIN QUERY PLAN '+sql,params)
        state={'phase':label,'eqpRawTuples':eqp,'results':result,'indexNames':[row[1] for row in fetch('plans','PRAGMA index_list(orders)')]};raw.setdefault('eqp',[]).append(state);return state
    before=plan_state('before-index')
    check('sqlite-eqp-before-index-observed-scan',any('SCAN orders' in row[3] for row in before['eqpRawTuples']),{'seedRows':plan_seed['rows'],'querySQL':sql,'bindings':list(params),'observed':before,'scope':'actual SQLite3.53 EQP tuples only; no PostgreSQL cost/ms/EXPLAIN ANALYZE/physical examined-row claim'})
    phase='eqp-index-added';execute('plans','CREATE INDEX orders_customer_created_idx ON orders(customer_id,created_at)');after=plan_state('after-index')
    check('sqlite-eqp-added-index-observed-search',any('SEARCH orders USING INDEX orders_customer_created_idx' in row[3] for row in after['eqpRawTuples']) and after['results']==before['results'],{'observed':after,'sameResultsAsBefore':True,'optimizerHintUsed':False,'scope':'this SQLite data/version chose SEARCH; no INDEXED BY, PostgreSQL plan or speed inference'})
    phase='eqp-index-dropped';execute('plans','DROP INDEX orders_customer_created_idx');dropped=plan_state('after-drop')
    phase='eqp-index-restored';execute('plans','CREATE INDEX orders_customer_created_idx ON orders(customer_id,created_at)');restored=plan_state('after-restore')
    check('sqlite-eqp-drop-restore-and-results-match',dropped['eqpRawTuples']==before['eqpRawTuples'] and restored['eqpRawTuples']==after['eqpRawTuples'] and all(s['results']==before['results'] for s in [after,dropped,restored]),{'afterDrop':dropped,'afterRestore':restored,'allFourResultsIdentical':True,'scope':'own disposable SQLite index drop/restore only; cached_statements=0 avoids stale prepared EQP; no MySQL invisible index or performance measurement'})
    phase='final-pragmas-integrity'
    fks={alias:fetch(alias,'PRAGMA foreign_keys')[0][0] for alias in connections}
    fk_check={alias:fetch(alias,'PRAGMA foreign_key_check') for alias in connections}
    integrity={alias:fetch(alias,'PRAGMA integrity_check')[0][0] for alias in connections}
    check('all-own-connections-fk-on-and-integrity-clean',all(value==1 for value in fks.values()) and all(rows==[] for rows in fk_check.values()) and all(value=='ok' for value in integrity.values()),{'foreignKeysPragma':fks,'foreignKeyCheck':fk_check,'integrity':integrity,'databaseFiles':4,'connections':len(connections),'scope':'these own SQLite files/connections only; no existing database checked'})
    phase='connections-close'
    closed={}
    for alias,conn in connections.items():
        assert not conn.in_transaction
        conn.close()
        try:conn.execute('SELECT 1');closed[alias]=False
        except sqlite3.ProgrammingError:closed[alias]=True
        raw['connections'][alias]['closed']=closed[alias]
    check('all-owned-sqlite-connections-closed',all(closed.values()),{'closedAliases':closed,'allOwnedConnectionsClosed':True,'longRunningProcessesOrServicePortsStarted':0,'existingServicesOrPracticeTouched':False})
    write_json(RUN/'observed.json',{'checks':checks,'facts':facts})
finally:
    for alias,conn in connections.items():
        try:
            if conn.in_transaction:conn.rollback()
            conn.close();raw['connections'][alias]['closed']=True
        except sqlite3.ProgrammingError:
            raw['connections'][alias]['closed']=True
    raw['checksReached']=checks
    write_json(RUN/'raw-sqlite.json',raw)
