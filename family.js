(function(root){
 'use strict';
 const names=['mom','charcoal','silver','russet'];
 class HuskyFamily {
  constructor(canvas,onError,onReady=()=>{}){
   this.canvas=canvas;this.ctx=canvas.getContext('2d');this.ready=false;this.time=0;
   this.sheets=[];this.tracks=names.map((_,i)=>new root.HuskyTransition.PoseTrack(i));
   this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
   Promise.all(names.map(name=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{try{resolve(this.prepare(image));}catch(e){reject(e);}};
    image.onerror=reject;image.src='motion-'+name+'-v4.png';
   }))).then(sheets=>{this.sheets=sheets;this.ready=true;onReady();}).catch(()=>onError('The husky animation could not load. Refresh to retry.'));
  }
  prepare(image){
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
   const gutters=(length,other,vertical)=>{
    const boundaries=[0];
    for(let n=1;n<4;n++){
     let best=Infinity,runs=[],run=null;
     const lo=Math.floor(length*(n/4-.06)),hi=Math.ceil(length*(n/4+.06));
     for(let a=lo;a<=hi;a++){
      let amount=0;for(let b=0;b<other;b++)if(vertical?ink(b,a):ink(a,b))amount++;
      if(amount<best){best=amount;runs=[];run=null;}
      if(amount===best){if(run&&run[1]===a-1)run[1]=a;else {run=[a,a];runs.push(run);}}else run=null;
     }
     const gap=runs.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];boundaries.push(Math.round((gap[0]+gap[1])/2));
    }boundaries.push(length);return boundaries;
   };
   const rows=gutters(h,w,true),cols=gutters(w,h,false),frames=[];
   for(let row=0;row<4;row++)for(let col=0;col<4;col++){
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
   const move=!still&&!freeze&&['playing','countdown'].includes(game.status);
   if(move)this.time+=dt;c.clearRect(0,0,1200,675);
   const placements=[{x:600,y:478,size:580},{x:370,y:577,size:275},{x:608,y:587,size:267},{x:850,y:576,size:278}];
   for(let row=0;row<4;row++){
    const track=this.tracks[row],stage=root.HuskyTransition.stableStage(root.HuskyBehavior.thresholds[row],game.wake,track.stage,game.status);
    const index=track.update(stage,dt,{freeze,immediate:still||game.status==='ready'});
    const data=this.sheets[row],f=data.frames[index],scale=Math.min(placements[row].size/data.maxW,(row===0?440:330)/data.maxH);
    const p=placements[row],m=move?root.HuskyBehavior.motionFor(row,this.time,game.wake):{x:0,y:0,rotation:0,sx:1,sy:1};
    c.save();c.translate(p.x+m.x,p.y+m.y);c.rotate(m.rotation);c.scale(m.sx,m.sy);
    // One fully opaque drawing, shared scale and bottom-center ground anchor.
    c.drawImage(data.surface,f.x,f.y,f.w,f.h,-f.w*scale/2,-f.h*scale,f.w*scale,f.h*scale);c.restore();
   }
  }
 }
 root.HuskyFamily=HuskyFamily;
})(window);

