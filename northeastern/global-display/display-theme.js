// Display-only preferences; deliberately separate from the other prototypes.
(()=>{
 const palette=[['Red','#FF352A'],['Blue','#0055FF'],['Purple','#9D4DFF'],['Pink','#FF007F'],['Orange','#FF8000'],['Cyan','#00FFFF'],['Lime Green','#00FF00'],['White','#FFFFFF']];
 const listeners=new Set();let hex='#0055FF';
 const profile=document.documentElement.dataset.displayProfile||'1';
 const maps={'1':{detail:1,route:1,label:1},'2':{detail:1,route:2,label:2},'3':{detail:2,route:2,label:2},'4':{detail:1,route:1,label:1},sheet:{detail:1,route:1,label:1}};
 const $=id=>document.getElementById(id),rgba=(a=1)=>`rgba(${hex.slice(1).match(/../g).map(v=>parseInt(v,16)).join(',')},${a})`;
 window.displaySettings={stroke:2,map:maps[profile]||maps['1'],profile};
 const bar=$('displayPalette');
 palette.forEach(([name,value])=>{
  const button=document.createElement('button');button.type='button';button.textContent=name;button.style.setProperty('--swatch',value);button.dataset.color=value;button.setAttribute('aria-label',name+' '+value);button.onclick=()=>set(value);bar.append(button);
  const option=document.createElement('option');option.value=value;option.textContent=name+' '+value;$('testColor')?.append(option);
 });
 const readout=document.createElement('output');readout.setAttribute('aria-live','polite');bar.append(readout);
 function set(value){
  if(!palette.some(p=>p[1]===value))return;hex=value;
  document.documentElement.style.setProperty('--mint',hex);document.documentElement.style.setProperty('--accent-rgb',hex.slice(1).match(/../g).map(v=>parseInt(v,16)).join(','));document.documentElement.style.setProperty('--display-stroke',window.displaySettings.stroke+'px');
  for(const b of bar.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.color===hex));
  readout.textContent=hex;if($('testColor'))$('testColor').value=hex;
  listeners.forEach(fn=>fn());patterns();
 }
 window.campusTheme={set,rgba,subscribe:fn=>listeners.add(fn)};
 if($('testColor'))$('testColor').onchange=e=>set(e.target.value);
 const hits=new Set();$('touchTest')?.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{hits.add(i);b.textContent='✓';b.style.borderColor='#fff';$('touchResult').textContent=hits.size+' of 5 targets hit. Last: target '+(i+1)+'.'});
 function patterns(){
  const canvas=$('patternCanvas');if(!canvas)return;const c=canvas.getContext('2d');c.clearRect(0,0,840,940);c.fillStyle='#000';c.fillRect(0,0,840,940);
  const txt=(s,x,y,size=18,color='#fff')=>{c.fillStyle=color;c.font=`${size}px Arial`;c.fillText(s,x,y)};
  txt('STROKES · CSS-pixel samples at native scale',16,30);
  [1,1.5,2,3,4].forEach((w,i)=>{const x=22+i*164;txt(w+' px',x,62);c.strokeStyle=hex;c.lineWidth=w;c.beginPath();c.moveTo(x,84);c.lineTo(x+135,84);c.moveTo(x,128);c.lineTo(x+135,101);c.stroke();c.beginPath();c.arc(x+66,157,12,0,Math.PI*2);c.stroke()});
  txt('TEXT · Read from touch distance and approach distance',16,210);
  [14,18,24,32].forEach((size,i)=>txt('Northeastern • Boston 1898',22,246+i*48,size));
  txt('SIGNAL LEVEL · 25% / 50% / 75% / 100%',16,445);
  [.25,.5,.75,1].forEach((a,i)=>{c.fillStyle=rgba(a);c.fillRect(22+i*202,464,178,45)});
  txt('SOLID vs GLOW · Do the soft edges help or disappear?',16,555);
  c.strokeStyle=hex;c.lineWidth=3;for(let i=0;i<2;i++){c.save();c.shadowBlur=i?16:0;c.shadowColor=hex;c.strokeRect(25+i*405,575,360,65);c.restore();txt(i?'GLOW':'SOLID',44+i*405,616,22)}
  txt('BLACK / CHARCOAL / GRAY / WHITE · Check the real background',16,685);
  ['#000000','#1A1A1A','#2A2A2A','#808080','#FFFFFF'].forEach((color,i)=>{c.fillStyle=color;c.fillRect(22+i*162,710,145,65);txt(color,22+i*162,802,16)});
  txt('GRADIENT · Look for lost dark tones or visible steps',16,850);const gradient=c.createLinearGradient(22,0,815,0);gradient.addColorStop(0,'#000');gradient.addColorStop(1,hex);c.fillStyle=gradient;c.fillRect(22,870,793,45);
  const scale=canvas.getBoundingClientRect().width/840;
  $('displayMetrics').textContent=`Viewport ${innerWidth} × ${innerHeight} CSS px · pixel ratio ${devicePixelRatio} · pattern scale ${Math.round(scale*100)}%. Stroke/text labels are exact at 100% pattern scale; resize or record this scale.`;
 }
 window.addEventListener('resize',patterns);set(hex);
})();
