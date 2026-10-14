(function(root){
 'use strict';
 const DURATION=8;
 function suggest(samples){
  const sorted=samples.filter(Number.isFinite).sort((a,b)=>a-b);
  if(sorted.length<30)return {error:'Not enough sound was measured. Keep this tab open and try again.'};
  const median=sorted[Math.floor(sorted.length*.5)],peak=sorted[Math.floor(sorted.length*.9)];
  if(peak<2)return {error:'Almost no input reached the microphone. Check the device and try again.'};
  if(peak>88)return {error:'The input is too high to leave useful headroom. Lower input sensitivity and try again.'};
  return {threshold:Math.max(15,Math.min(95,Math.ceil(peak+8))),baseline:Math.round(median)};
 }
 class Calibration {
  constructor(){this.cancel();}
  start(){this.active=true;this.elapsed=0;this.samples=[];this.next=.25;}
  cancel(){this.active=false;this.elapsed=0;this.samples=[];}
  update(dt,level){
   if(!this.active)return null;
   this.elapsed+=Math.max(0,dt);
   if(this.elapsed>=this.next){this.samples.push(level);this.next+=.1;}
   if(this.elapsed<DURATION)return null;
   this.active=false;return suggest(this.samples);
  }
 }
 const api={Calibration,suggest,DURATION};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HuskyCalibration=api;
})(globalThis);
