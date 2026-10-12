(function(root){
 'use strict';
 const keys=[0,5,10,15];
 // Playback traverses authored in-between drawings in both directions. Never
 // dissolve two silhouettes. Retarget from the displayed position on reversal.
 class PoseTrack {
  constructor(row){this.row=row;this.position=0;this.from=0;this.to=0;this.elapsed=0;this.duration=0;this.stage=0;}
  snap(stage){this.stage=stage;this.position=this.from=this.to=keys[stage];this.elapsed=this.duration=0;return this.frame;}
  update(stage,dt,{freeze=false,immediate=false}={}){
   if(immediate)return this.snap(stage);
   if(freeze)return this.frame;
   if(stage!==this.stage){
    this.stage=stage;this.from=this.position;this.to=keys[stage];this.elapsed=0;
    // Mom is heavier; settling movements are slower than waking movements.
    const secondsPerStage=(this.to<this.from?1.35:.85)*(this.row===0?1.15:1+this.row*.04);
    this.duration=Math.max(.15,Math.abs(this.to-this.from)/5*secondsPerStage);
   }
   this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,dt));
   const t=this.duration?this.elapsed/this.duration:1;
   const eased=t*t*(3-2*t);
   this.position=this.from+(this.to-this.from)*eased;
   return this.frame;
  }
  get frame(){return Math.max(0,Math.min(15,Math.round(this.position)));}
 }
 function stableStage(thresholds,wake,current,status){
  if(status==='ready'||status==='won')return 0;
  if(status==='lost')return 3;
  let stage=current;
  while(stage<3&&wake>=thresholds[stage])stage++;
  while(stage>0&&wake<thresholds[stage-1]-4)stage--;
  return stage;
 }
 const api={PoseTrack,stableStage,keys};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HuskyTransition=api;
})(globalThis);
