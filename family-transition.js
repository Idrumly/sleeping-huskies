(function(root){
 'use strict';
 const keys=[0,15,39,47],EYES_OPEN=43,CLOSED_LIMIT=42,order=[1,2,3,0];
 function travelTime(from,to,row){
  const low=Math.min(from,to),high=Math.max(from,to);
  let stages=0;for(let i=1;i<keys.length;i++)stages+=Math.max(0,Math.min(high,keys[i])-Math.max(low,keys[i-1]))/(keys[i]-keys[i-1]);
  return stages*(to<from?3.2:2)*(row===0?1.15:1+(row-1)*.04);
 }
 class PoseTrack {
  constructor(row){this.row=row;this.position=0;this.from=0;this.to=0;this.elapsed=0;this.duration=0;this.stage=0;}
  snap(stage,maxFrame=47){this.stage=stage;this.position=this.from=this.to=Math.min(keys[stage],maxFrame);this.elapsed=this.duration=0;return this.frame;}
  update(stage,dt,{freeze=false,immediate=false,maxFrame=47}={}){
   if(freeze)return this.frame;
   if(immediate)return this.snap(stage,maxFrame);
   const target=Math.min(keys[stage],maxFrame);
   if(target!==this.to){
    this.stage=stage;this.from=this.position;this.to=target;this.elapsed=0;
    this.duration=Math.max(.12,travelTime(this.from,this.to,this.row));
   }else this.stage=stage;
   this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,dt));
   const t=this.duration?this.elapsed/this.duration:1,eased=t*t*(3-2*t);
   this.position=this.from+(this.to-this.from)*eased;
   return this.frame;
  }
  get frame(){return Math.max(0,Math.min(47,Math.round(this.position)));}
 }
 function stableStage(thresholds,wake,current,status){
  if(status==='ready'||status==='won')return 0;
  if(status==='lost')return 3;
  let stage=current;
  while(stage<3&&wake>=thresholds[stage])stage++;
  while(stage>0&&wake<thresholds[stage-1]-4)stage--;
  return stage;
 }
 class FamilyTimeline {
  constructor(thresholds,awakeAt){this.thresholds=thresholds;this.awakeAt=awakeAt;this.tracks=[0,1,2,3].map(i=>new PoseTrack(i));this.held=[0,0,0,0];this.lastStatus='ready';}
  reset(){this.tracks.forEach(t=>t.snap(0));this.held.fill(0);}
  update(game,dt,{freeze=false,immediate=false}={}){
   if(game.status==='ready'||(game.status==='countdown'&&['ready','won','lost'].includes(this.lastStatus)))this.reset();
   this.lastStatus=game.status;
   if(freeze||game.status==='paused')return this.frames;
   // Bounded substeps keep wake sequencing independent of the display rate.
   let remaining=Math.max(0,dt);
   do{
    const step=Math.min(.05,remaining),previous=this.tracks.map(t=>t.position);
    for(const row of order){
     const t=this.tracks[row],stage=stableStage(this.thresholds[row],game.wake,t.stage,game.status);
     const predecessor=order[order.indexOf(row)-1];
     const previousAwake=predecessor===undefined||(previous[predecessor]>=47&&this.held[predecessor]>=.65);
     const highEnough=game.status==='lost'||game.wake>=this.awakeAt[row]-(t.frame>=EYES_OPEN?4:0);
     const maxFrame=previousAwake&&highEnough?47:CLOSED_LIMIT;
     t.update(stage,step,{immediate,maxFrame});
    }
    this.tracks.forEach((t,i)=>{this.held[i]=t.position>=47?this.held[i]+step:0;});
    remaining-=step;
   }while(remaining>1e-9);
   return this.frames;
  }
  get frames(){return this.tracks.map(t=>t.frame);}
  get awake(){return this.tracks.map(t=>t.frame>=EYES_OPEN);}
 }
 const api={PoseTrack,FamilyTimeline,stableStage,keys,EYES_OPEN,CLOSED_LIMIT,order,travelTime};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HuskyTransition=api;
})(globalThis);

