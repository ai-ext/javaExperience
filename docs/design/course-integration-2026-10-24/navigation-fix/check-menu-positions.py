import json,sys
rows=json.load(open(sys.argv[1])); reference=rows[0]; failures=[]
for row in rows:
 for actual,expected in zip(row['menu'],reference['menu']):
  for prop in ['x','y','w','h']:
   if abs(actual[prop]-expected[prop])>0.1:failures.append((row['url'],actual['name'],prop,expected[prop],actual[prop]))
 if abs(row['header']['height']-reference['header']['height'])>0.1:failures.append((row['url'],'header','height',reference['header']['height'],row['header']['height']))
print(json.dumps({'pages':len(rows),'failures':len(failures),'examples':failures[:6]},ensure_ascii=False))
raise SystemExit(bool(failures))
