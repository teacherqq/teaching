import json,base64,os,re
from opencc import OpenCC
m=json.load(open('meta.json',encoding='utf-8'))
# 沒有 lesson1.json 時是不帶課文的課件（例如單元導入），只有 extras 等頁面，標題寫在 meta.title
d=json.load(open('lesson1.json',encoding='utf-8')) if os.path.exists('lesson1.json') else {'title':m['title'],'paras':[]}
blocks=[{'type':'title','text':d['title']}] if d['paras'] else []
if d.get('salutation'): blocks.append({'type':'flush','text':d['salutation'],'tag':'稱呼'})
for i,p in enumerate(d['paras']): blocks.append({'type':'p','text':p,'tag':m['paraTags'][i]})
c=d.get('closing') or []
if c:
    blocks+=[{'type':'indent','text':c[0],'tag':'祝頌語'},{'type':'flush','text':c[1]},
             {'type':'right','text':c[2],'tag':'署名'},{'type':'right','text':c[3]},{'type':'right','text':c[4],'tag':'日期'}]
AUD={os.path.splitext(f)[0]:'data:audio/mpeg;base64,'+base64.b64encode(open('a64/'+f,'rb').read()).decode()
     for f in sorted(os.listdir('a64')) if f.endswith('.mp3')} if os.path.isdir('a64') else {}
cc=OpenCC('t2s')
sp=lambda s:re.findall(r'[^。！？；：]+[。！？；：]*[」』”]?|[」』”]+',s) or [s]
for x in blocks:
    x['textS']=cc.convert(x['text'])
    assert len(sp(x['text']))==len(sp(x['textS'])),x['text'][:6]
for v in m.get('vocab',[]): v['ws']=cc.convert(v['w']);v['exS']=cc.convert(v['ex'])
def durl(p):
    ext=os.path.splitext(p)[1].lower().lstrip('.').replace('jpg','jpeg')
    return f'data:image/{ext};base64,'+base64.b64encode(open(p,'rb').read()).decode()
for s in m.get('slides',[]):
    if s.get('img') and not s['img'].startswith('data:'): s['img']=durl(s['img'])
for x in m.get('extras',[]):
    for k in ('poster','img'):
        if x.get(k) and not x[k].startswith('data:') and not os.path.exists(x[k]): del x[k]  # 圖還沒到就先不放
        if x.get(k) and not x[k].startswith('data:'): x[k]=durl(x[k])
    if x.get('imgs'): x['imgs']=[s if s.startswith('data:') else durl(s) for s in x['imgs']]
for k,v in m.get('bgs',{}).items():
    if not v.startswith('data:'): m['bgs'][k]=durl(v)
if any('segs' in s for s in m.get('slides',[])):
    seq=[(b,j) for s in m['slides'] for b,a,e in s['segs'] for j in range(a,e+1)]
    assert seq==[(b,j) for b,x in enumerate(blocks) for j in range(len(sp(x['text'])))],'slides.segs 沒有按順序覆蓋每一句'
# 繁簡切換：c2 單字表，x2 整句轉換和逐字轉換不同的片段
tpl=open('template.html',encoding='utf-8').read()
C2={ch:cc.convert(ch) for ch in set(tpl+json.dumps(m,ensure_ascii=False)) if '㐀'<=ch<='鿿' and cc.convert(ch)!=ch}
X2={}
def walk(o):
    if isinstance(o,str):
        if o.startswith('data:'):return
        for seg in re.findall(r'[㐀-鿿]+',o):
            s2=cc.convert(seg)
            if s2!=''.join(C2.get(c,c) for c in seg):X2[seg]=s2
    elif isinstance(o,dict):[walk(v) for v in o.values()]
    elif isinstance(o,list):[walk(v) for v in o]
walk(m);m['c2']=C2;m['x2']=X2
L=dict(title=d['title'],blocks=blocks,audio=AUD,**{k:v for k,v in m.items() if k not in ('paraTags','title')})
if os.path.exists('img/illus.webp'): L['image']=durl('img/illus.webp')
t=tpl.replace('__TITLE__',d['title']).replace('__LESSON_JSON__',json.dumps(L,ensure_ascii=False))
open('index.html','w',encoding='utf-8').write(t);print(len(t))
