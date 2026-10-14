(function(root){
 'use strict';
 const names=['mom','charcoal','silver','russet'];
 class HuskyFamily {
  constructor(canvas,onError,onReady=()=>{}){
   this.canvas=canvas;this.ctx=canvas.getContext('2d');this.ready=false;this.time=0;
   this.sheets=[];this.reward=null;this.rewardTime=0;this.lastStatus='';this.timeline=new root.HuskyTransition.FamilyTimeline(root.HuskyBehavior.thresholds,root.HuskyBehavior.awakeAt);this.tracks=this.timeline.tracks;
   this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
   Promise.all(names.map(name=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{try{resolve(this.prepare(image));}catch(e){reject(e);}};
    image.onerror=reject;image.src='motion-'+name+'-v5.png';
   }))).then(async sheets=>{this.sheets=sheets;await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{try{this.reward=this.prepare(image,4,8);resolve();}catch(e){reject(e);}};image.onerror=reject;image.src='family-reward-v6.png';});this.ready=true;onReady();}).catch(()=>onError('The husky animation could not load. Refresh to retry.'));
  }
  prepare(image,rowCount=6,colCount=8){
   const w=image.width,h=image.height,surface=document.createElement('canvas');surface.width=w;surface.height=h;
   const c=surface.getContext('2d');c.drawImage(image,0,0);
   const bitmap=c.getImageData(0,0,w,h),pixels=bitmap.data,count=w*h;
   // Composite paper-backed drawings without erasing enclosed white fur.
   const seen=new Uint8Array(count),queue=new Int32Array(count);let head=0,tail=0;
   const visit=n=>{if(n<0||n>=count||seen[n])return;seen[n]=1;const i=n*4,min=Math.min(pixels[i],pixels[i+1],pixels[i+2]),max=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(min>225&&max-min<24){queue[tail++]=n;pixels[i+3]=0;}};
   for(let x=0;x<w;x++){visit(x);visit(count-w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
   while(head<tail){const n=queue[head++],x=n%w;if(x>0)visit(n-1);if(x<w-1)visit(n+1);visit(n-w);visit(n+w);}
   c.putImageData(bitmap,0,0);
   const ink=(x,y)=>{const i=(y*w+x)*4;return pixels[i+3]>32&&Math.min(pixels[i],pixels[i+1],pixels[i+2])<235;};
   // Find actual gutters: fixed quarter-height cuts could clip ears or paws.
   const gutters=(length,other,vertical,parts)=>{
    const boundaries=[0];
    for(let n=1;n<parts;n++){
     let best=Infinity,runs=[],run=null;
     const radius=.28/parts,lo=Math.floor(length*(n/parts-radius)),hi=Math.ceil(length*(n/parts+radius));
     for(let a=lo;a<=hi;a++){
      let amount=0;for(let b=0;b<other;b++)if(vertical?ink(b,a):ink(a,b))amount++;
      if(amount<best){best=amount;runs=[];run=null;}
      if(amount===best){if(run&&run[1]===a-1)run[1]=a;else {run=[a,a];runs.push(run);}}else run=null;
     }
     const gap=runs.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];boundaries.push(Math.round((gap[0]+gap[1])/2));
    }boundaries.push(length);return boundaries;
   };
   const rows=gutters(h,w,true,rowCount),cols=gutters(w,h,false,colCount),frames=[];
   for(let row=0;row<rowCount;row++)for(let col=0;col<colCount;col++){
    let minX=w,minY=h,maxX=-1,maxY=-1;
    for(let y=rows[row];y<rows[row+1];y++)for(let x=cols[col];x<cols[col+1];x++)if(ink(x,y)){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    if(maxX<minX)throw new Error('Missing animation frame');
    frames.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1});
   }
   return {surface,frames,maxW:Math.max(...frames.map(f=>f.w)),maxH:Math.max(...frames.map(f=>f.h))};
  }
  draw(game,dt,paused){
   if(!this.ready)return;
   const c=this.ctx,freeze=game.status==='paused',still=paused||this.reduced.matches;
   const move=!still&&!freeze&&['ready','playing','countdown','won'].includes(game.status);
   if(game.status!==this.lastStatus){this.rewardTime=0;this.lastStatus=game.status;}
   const celebrating=game.status==='won'&&this.timeline.awake.every(Boolean);
   if(celebrating&&!still)this.rewardTime+=dt;
   if(move)this.time+=dt;c.clearRect(0,0,1200,675);
   const indices=this.timeline.update(game,dt,{freeze,immediate:still||game.status==='ready'});
   const placements=[{x:600,y:478,size:580},{x:370,y:577,size:275},{x:608,y:587,size:267},{x:850,y:576,size:278}];
   for(let row=0;row<4;row++){
    const index=indices[row];
    const data=this.sheets[row],f=data.frames[index],scale=Math.min(placements[row].size/data.maxW,(row===0?440:330)/data.maxH);
    const p=placements[row],m=move?root.HuskyBehavior.motionFor(row,this.time,game.wake):{x:0,y:0,rotation:0,sx:1,sy:1};
    if(celebrating){
     const age=Math.max(0,this.rewardTime-row*.28);
     const rewardFrame=still?7:age<4?Math.min(7,Math.floor(age*2)):[4,5,6,7,6,5][Math.floor((age-4)*2)%6];
     const rf=this.reward.frames[row*8+rewardFrame];
     const rowFrames=this.reward.frames.slice(row*8,row*8+8);
     const rs=Math.min(p.size/Math.max(...rowFrames.map(v=>v.w)),(row===0?400:290)/Math.max(...rowFrames.map(v=>v.h)));
     const bounce=still?0:Math.max(0,Math.sin(age*3.2+row))*(row===0?3:14);
     c.save();c.translate(p.x+(still?0:Math.sin(age*1.6+row)*(row===0?2:10)),p.y-bounce);
     c.drawImage(this.reward.surface,rf.x,rf.y,rf.w,rf.h,-rf.w*rs/2,-rf.h*rs,rf.w*rs,rf.h*rs);c.restore();continue;
    }
    c.save();c.translate(p.x+m.x,p.y+m.y);c.rotate(m.rotation);c.scale(m.sx,m.sy);
    // One fully opaque drawing, shared scale and bottom-center ground anchor.
    c.drawImage(data.surface,f.x,f.y,f.w,f.h,-f.w*scale/2,-f.h*scale,f.w*scale,f.h*scale);c.restore();
   }
  }
 }
 root.HuskyFamily=HuskyFamily;
})(window);

