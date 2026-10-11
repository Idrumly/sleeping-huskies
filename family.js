(function(root){
 'use strict';
 class HuskyFamily {
  constructor(canvas,onError){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.atlas=new Image();this.ready=false;this.time=0;this.level=0;this.frames=[];this.poses=[0,0,0,0];this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.atlas.onload=()=>{try{this.prepare();this.ready=true;}catch{onError('The husky artwork could not load. Refresh to retry.');}};this.atlas.onerror=()=>onError('The husky artwork did not load. Refresh to retry.');this.atlas.src='husky-atlas.png';}
  prepare(){const image=this.atlas,cw=Math.floor(image.width/4);const rows=[0,.29,.50,.71,1].map(v=>Math.floor(v*image.height));const scratch=document.createElement('canvas');scratch.width=image.width;scratch.height=image.height;const c=scratch.getContext('2d');c.drawImage(image,0,0);const bitmap=c.getImageData(0,0,image.width,image.height),pixels=bitmap.data;
   // Runtime paper matte: only edge-connected neutral white is excluded.
   // Enclosed white fur remains opaque; the original atlas is left unchanged.
   const count=image.width*image.height,seen=new Uint8Array(count),queue=new Int32Array(count);let head=0,tail=0;
   const visit=n=>{if(n<0||n>=count||seen[n])return;seen[n]=1;const i=n*4,min=Math.min(pixels[i],pixels[i+1],pixels[i+2]),max=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(min>225&&max-min<24){queue[tail++]=n;pixels[i+3]=0;}};
   for(let x=0;x<image.width;x++){visit(x);visit(count-image.width+x);}for(let y=0;y<image.height;y++){visit(y*image.width);visit(y*image.width+image.width-1);}while(head<tail){const n=queue[head++],x=n%image.width;if(x>0)visit(n-1);if(x<image.width-1)visit(n+1);visit(n-image.width);visit(n+image.width);}c.putImageData(bitmap,0,0);this.surface=scratch;
   for(let row=0;row<4;row++){const y0=rows[row],ch=rows[row+1]-y0,frames=[];for(let col=0;col<4;col++){let minX=cw,minY=ch,maxX=0,maxY=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=((y0+y)*image.width+col*cw+x)*4;if(pixels[i+3]>32&&Math.min(pixels[i],pixels[i+1],pixels[i+2])<235){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}frames.push({x:col*cw+minX,y:y0+minY,w:maxX-minX+1,h:maxY-minY+1});}const maxW=Math.max(...frames.map(f=>f.w)),maxH=Math.max(...frames.map(f=>f.h));this.frames.push({frames,maxW,maxH});}
  }
  draw(game,dt,paused){if(!this.ready)return;const c=this.ctx,w=1200,h=675;if(this.canvas.width!==w){this.canvas.width=w;this.canvas.height=h;}const move=!paused&&!this.reduced.matches&&['playing','countdown'].includes(game.status);if(move)this.time+=dt;const desired=game.status==='lost'?100:game.status==='won'?0:game.wake;this.level+=(desired-this.level)*(1-Math.exp(-dt*3));if(this.reduced.matches||paused)this.level=desired;c.clearRect(0,0,w,h);
   const placements=[{x:600,y:478,size:580},{x:370,y:577,size:275},{x:608,y:587,size:267},{x:850,y:576,size:278}];
   for(let row=0;row<4;row++){const p=placements[row],phase=this.time*(row?1.7:1.2)+row*1.9;const awake=game.status==='lost';let target;if(row===0)target=awake?3:this.level>75?2:this.level>42?1:0;else{const wake=this.level+(row-2)*5;target=awake?3:wake>72?3:wake>42?2:wake>18?1:0;}
    if(this.reduced.matches||paused)this.poses[row]=target;else this.poses[row]+=Math.sign(target-this.poses[row])*Math.min(Math.abs(target-this.poses[row]),dt*4);const pose=this.poses[row];const a=Math.floor(pose),b=Math.min(3,a+1),mix=pose-a;const data=this.frames[row],scale=p.size/data.maxW;
    const restless=move&&this.level>42&&row>0,breath=move?Math.sin(phase)*.012:0;const shift=restless?Math.sin(phase*2)*4:0;c.save();c.translate(p.x+shift,p.y);if(restless)c.rotate(Math.sin(phase)*.022);c.scale(1,1+breath);
    const drawFrame=(i,alpha)=>{if(alpha<=0)return;const f=data.frames[i];c.globalAlpha=alpha;c.drawImage(this.surface,f.x,f.y,f.w,f.h,-f.w*scale/2,-f.h*scale,f.w*scale,f.h*scale);};drawFrame(a,1-mix);if(b!==a)drawFrame(b,mix);c.restore();
   }
  }
 }
 root.HuskyFamily=HuskyFamily;
})(window);
