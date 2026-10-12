(function(root){
 'use strict';
 // Each animal has different thresholds, breathing, and short movement bursts.
 // Decorative motion never affects microphone input or scoring.
 const profiles=[
  {thresholds:[40,60,88],awakeAt:100,breath:5.2,phase:0,period:13,offset:3,duration:1.8},
  {thresholds:[18,38,64],awakeAt:64,breath:3.7,phase:1.2,period:7.1,offset:0,duration:1.9},
  {thresholds:[24,45,76],awakeAt:76,breath:4.4,phase:2.8,period:9.3,offset:3.2,duration:2.8},
  {thresholds:[30,53,88],awakeAt:88,breath:3.2,phase:4.6,period:11.7,offset:6.1,duration:1.4}
 ];
 function poseFor(row,wake,status){if(status==='won'||status==='ready')return 0;if(status==='lost')return 3;return profiles[row].thresholds.filter(t=>wake>=t).length;}
 function motionFor(row,time,wake){const p=profiles[row],cycle=(time+p.offset)%p.period;const burst=cycle<p.duration?Math.sin(Math.PI*cycle/p.duration)**2:0;const active=wake>=p.thresholds[0]?burst:0;const breathing=Math.sin(time*2*Math.PI/p.breath+p.phase)*.005;
  if(row===0)return {x:0,y:0,rotation:0,sx:1,sy:1+breathing};
  if(row===1)return {x:-2*active,y:0,rotation:-.004*active,sx:1+.018*active,sy:1+breathing-.008*active};
  if(row===2)return {x:5*active,y:-1.2*active,rotation:.035*active*Math.sin(cycle*3.2),sx:1-.008*active,sy:1+breathing+.006*active};
  return {x:0,y:-2.5*active,rotation:-.013*active,sx:1,sy:1+breathing+.008*active};
 }
 const api={poseFor,motionFor,thresholds:profiles.map(p=>p.thresholds),awakeAt:profiles.map(p=>p.awakeAt)};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HuskyBehavior=api;
})(globalThis);
