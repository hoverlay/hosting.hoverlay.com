// Rounded pulse frames + synchronized square-to-line-to-dot exits.
(()=>{
const TAU=Math.PI*2,CYCLE=9,ink=a=>window.campusTheme.rgba(a);
let copy={};const $=id=>({value:copy[id]});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v);return 1-Math.pow(1-v,3)};
function phaseAt(t){const p=((t%CYCLE)+CYCLE)%CYCLE;if(p<1.25)return{phase:'OPEN',open:ease(p/1.25),write:0,p};if(p<5)return{phase:'WRITE',open:1,write:(p-1.25)/3.75,p};if(p<7.2)return{phase:'HOLD',open:1,write:1,p};if(p<8.45)return{phase:'CLOSE',open:1-ease((p-7.2)/1.25),write:1,p};return{phase:'RESET',open:0,write:0,p}}
function line(c,x,y,xx,yy,a=.5,w=1){c.strokeStyle=ink(a);c.lineWidth=Math.max(window.displaySettings.stroke/1.2,w);c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()}
function dot(c,x,y,r=2,a=1){c.fillStyle=ink(a);c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
function ring(c,x,y,r,a=.5,w=1,start=0,end=TAU){c.strokeStyle=ink(a);c.lineWidth=Math.max(window.displaySettings.stroke/1.2,w);c.beginPath();c.arc(x,y,r,start,end);c.stroke()}
function text(c,str,x,y,size=10,a=1,accent=false,align='center'){c.fillStyle=accent?ink(a):`rgba(255,255,255,${a})`;c.font=`${size>=30?600:500} ${size}px ${size<10?'monospace':'Arial, sans-serif'}`;c.textAlign=align;c.fillText(str,x,y)}
function rounded(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function placement(){return{x:200,y:97,w:224,value:43,body:14}}
function wrap(c,str,width){const lines=[];for(const paragraph of str.split('\n')){let row='';for(const word of paragraph.split(/\s+/)){const candidate=row?row+' '+word:word;if(c.measureText(candidate).width>width&&row){lines.push(row);row=word}else row=candidate}lines.push(row)}return lines}
function typeContent(c,i,s){const box=placement(i),heading=$('demoHeading').value,value=$('demoValue').value,body=$('demoBody').value;
 const total=heading.length+value.length+body.length,chars=Math.floor(s.write*total);let remaining=chars;
 const h=heading.slice(0,remaining);remaining=Math.max(0,remaining-heading.length);const v=value.slice(0,remaining);remaining=Math.max(0,remaining-value.length);const b=body.slice(0,remaining);
 const headingSize=Math.min(12,box.w/Math.max(1,heading.length)*1.55),valueSize=Math.min(box.value,box.w/Math.max(1,value.length)*1.55);
 text(c,h,box.x,box.y,headingSize,1,false);text(c,v,box.x,box.y+49,valueSize,1);
 c.font=`${box.body}px Arial, sans-serif`;const fullLines=wrap(c,body,box.w),typedLines=wrap(c,b,box.w);const bodySize=fullLines.length>4?10:box.body;c.font=`${bodySize}px Arial, sans-serif`;const lines=wrap(c,b,box.w);const y=box.y+73;
 for(let j=0;j<Math.min(lines.length,5);j++)text(c,lines[j],box.x,y+j*(bodySize+4),bodySize,1);
 if(s.phase==='WRITE'&&Math.floor(s.p*5)%2===0){let xx=box.x+4,yy=box.y-6;if(chars>=heading.length&&chars<heading.length+value.length){xx=box.x+c.measureText(v).width/2+8;yy=box.y+34}else if(chars>=heading.length+value.length){const last=lines[Math.min(lines.length,5)-1]||'';c.font=`${bodySize}px Arial, sans-serif`;xx=box.x+c.measureText(last).width/2+4;yy=y+(Math.min(lines.length,5)-1)*(bodySize+4)-9}line(c,xx,yy,xx,yy+11,1,1.4)}
}
function collapseGeometry(p,i,overrideQ){
 const closing=p>=7.2,opening=p<1.25;
 let q=closing?clamp((p-7.2)/1.25):opening?1-clamp(p/1.05):0;
 if(overrideQ!==undefined)q=overrideQ;
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
 const flatten=smooth(q/.48),contract=smooth((q-.48)/.34),fade=smooth((q-.82)/.18);
 const long=276*(1-contract)+3*contract,short=182*(1-flatten)+3*flatten;
 return {w:i===20?long:short,h:i===20?short:long,alpha:1-fade,q,closing,opening};
}
function renderCollapse(c,i,s,motionTime){
 const g=collapseGeometry(s.p,i,s.collapseQ);
 if(s.phase==='RESET'||g.alpha<=0)return s;
 c.save();c.globalAlpha=g.alpha;
 const x=200-g.w/2,y=157-g.h/2;
 rounded(c,x,y,g.w,g.h,Math.min(24,g.w/2,g.h/2));
 c.fillStyle='#000';c.fill();c.strokeStyle=ink(1);c.lineWidth=window.displaySettings.stroke/1.2;c.stroke();
 if(g.q===0){c.save();c.setLineDash([35,900]);c.lineDashOffset=-motionTime*90;c.strokeStyle='#fff';c.lineWidth=3;c.stroke();c.restore()}
 c.save();c.clip();
 c.globalAlpha*=1-clamp(g.q/.32);
 if(!g.opening)typeContent(c,i,s);
 c.restore();
 // Card 12's detached targeting corners follow the collapsing glass.
 const k=1-g.q,gap=5*k;
 for(const [xx,yy,dx,dy] of [[x-gap,y-gap,1,1],[x+g.w+gap,y-gap,-1,1],[x-gap,y+g.h+gap,1,-1],[x+g.w+gap,y+g.h+gap,-1,-1]]){
  line(c,xx,yy,xx+dx*17*k,yy,.9,1.5);line(c,xx,yy,xx,yy+dy*13*k,.9,1.5);
 }
 if(g.q>.79){c.shadowColor=ink(1);c.shadowBlur=0;dot(c,200,157,1.8,1)}
 c.restore();
 return s;
}


const canvases=[...document.querySelectorAll('.factoid-panel')];
let closingCards=null;
function clear(){closingCards=null;for(const canvas of canvases){const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height)}}
function facts(c){return [
 {demoHeading:'ESTABLISHED',demoValue:String(c.established),demoBody:c.id==='london'?'Founded in 2012. Joined Northeastern in 2019.':c.name+' in the Northeastern global campus network.'},
 {demoHeading:'HOME BASE',demoValue:c.name,demoBody:c.region},
 {demoHeading:'GLOBAL CONNECTION',demoValue:c.id==='london'?'EUROPE':'N. AMERICA',demoBody:'One university, connected across borders.'},
 {demoHeading:'LOCATION',demoValue:c.lat.toFixed(2)+'°N',demoBody:Math.abs(c.lon).toFixed(2)+'° W · '+c.region}
]}
function draw(c,t){const items=facts(c);canvases.forEach((canvas,i)=>{
 const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,800,800);ctx.setTransform(2.5,0,0,2.5,-100,-82.5);
 const local=t-i*.18;if(local<0)return;
 // Open and type, retain a generous reading interval, then close once.
 const p=local<5?local:local<10?6:7.2+(local-10);
 if(p>=8.45)return;copy=items[i];renderCollapse(ctx,20,phaseAt(p),local);
 canvas.setAttribute('aria-label',Object.values(copy).join('. '));canvas.setAttribute('role','img');
})}
function beginClose(c,t){
 const items=facts(c);
 closingCards=items.map((item,i)=>{
  const local=t-i*.18,p=local<5?local:local<10?6:7.2+(local-10);
  if(local<0||p>=8.45)return null;
  const state=phaseAt(p),g=collapseGeometry(p,20);
  if(g.alpha<=0)return null;
  return{item,state,q:g.q,local};
 });
 return closingCards.some(Boolean);
}
function drawClose(elapsed){
 const u=clamp(elapsed/.9),e=u*u*(3-2*u);
 canvases.forEach((canvas,i)=>{
  const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  const card=closingCards?.[i];if(!card||u===1)return;
  ctx.setTransform(2.5,0,0,2.5,-100,-82.5);copy=card.item;
  renderCollapse(ctx,20,{...card.state,phase:'CLOSE',collapseQ:card.q+(1-card.q)*e},card.local+elapsed);
 });
 return u===1;
}
window.campusFactoids={draw,clear,beginClose,drawClose};
})();
