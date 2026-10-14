(function (root) {
  'use strict';
  // Sustained loud noise rises at up to 12 points/second; quiet recovers
  // at one third that speed. Softer excess noise still rises more slowly.
  const MAX_WAKE_RATE=12, RECOVERY_RATE=MAX_WAKE_RATE/3;
  const presets = {reading:{name:'Quiet Reading',threshold:30},classwork:{name:'Focused Classwork',threshold:45},partner:{name:'Partner Work',threshold:60}};
  function create(duration=30, threshold=30) { return {status:'ready',duration,remaining:duration,threshold,wake:0,countdown:10}; }
  function start(s) { if(s.status==='ready') s.status='countdown'; }
  function pause(s) { if(['playing','countdown'].includes(s.status)) {s.status='paused';} }
  function resume(s) {if(s.status==='paused') {s.countdown=10;s.status='countdown';}}
  function step(s,dt,level) {
    if(!Number.isFinite(dt)||dt<=0) return;
    level=Number.isFinite(level)?Math.min(100,Math.max(0,level)):0;
    if(s.status==='countdown') { const spent=Math.min(dt,s.countdown);s.countdown-=spent;dt-=spent;if(s.countdown<=0)s.status='playing'; }
    if(s.status!=='playing'||dt<=0) return;
    const active=Math.min(dt,s.remaining);
    const rate=level>s.threshold?Math.min(MAX_WAKE_RATE,(level-s.threshold)/3):level<s.threshold-5?-RECOVERY_RATE:0;
    s.wake=Math.max(0,Math.min(100,s.wake+rate*active));
    s.remaining=Math.max(0,s.remaining-active);
    if(s.wake>=100)s.status='lost';else if(s.remaining<=0)s.status='won';
  }
  const api={presets,create,start,pause,resume,step};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HuskyEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
