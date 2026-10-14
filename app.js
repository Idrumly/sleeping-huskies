'use strict';
const E=window.HuskyEngine,$=id=>document.getElementById(id);
let game=E.create(),winCount=0,earned=0,previous=performance.now(),lastStatus='',lastBand=-1,motionPaused=false;
const live=()=>['countdown','playing','paused'].includes(game.status);
const calibration=new HuskyCalibration.Calibration(),goals={};
const warnings=new window.PuppyWarnings(window);
const family=new window.HuskyFamily($('family'),message=>{$('artStatus').textContent=message;},()=>{$('artStatus').textContent='';});
function settings(show){document.body.classList.toggle('classroom-mode',!show);$('settings').textContent=show?'Hide teacher settings':'Teacher settings';$('settings').setAttribute('aria-expanded',String(show));if(!show)window.scrollTo({top:0,behavior:'instant'});}
function announce(text){$('announcement').textContent=text;}
function cancelCalibration(message){if(calibration.active){calibration.cancel();$('calibrationStatus').textContent=message;}}
const mic=new window.HuskyMicrophone(window,message=>{
 $('micStatus').textContent=message;
 if(!mic.active){cancelCalibration('Calibration stopped. Enable the microphone and try again.');if(['playing','countdown'].includes(game.status)){E.pause(game);warnings.stop();settings(true);}}
});
async function refreshDevices(){try{const selected=$('device').value,devices=await navigator.mediaDevices.enumerateDevices();$('device').replaceChildren(new Option('Default microphone',''));for(const d of devices.filter(d=>d.kind==='audioinput'))$('device').add(new Option(d.label||'Microphone',d.deviceId));if([...$('device').options].some(o=>o.value===selected))$('device').value=selected;}catch{}}
$('enableMic').onclick=async()=>{const pending=mic.start($('device').value);render();await pending;if(mic.active)await refreshDevices();render();};
$('stopMic').onclick=()=>{mic.stop();render();};
function invalidateGoals(){for(const key of Object.keys(goals))delete goals[key];$('calibrationStatus').textContent='Input changed. Calibrate again for this room.';}
$('device').onchange=()=>{mic.stop('Input changed. Enable microphone to use this device.');invalidateGoals();render();};
$('gain').oninput=()=>{$('gainText').textContent=$('gain').value+'×';invalidateGoals();};
$('calibrate').onclick=()=>{
 if(calibration.active){cancelCalibration('Calibration cancelled. Your previous goal is unchanged.');render();return;}
 if(!mic.active||live())return;
 warnings.reset();calibration.start();$('calibrationStatus').textContent='Make the sound you want to allow for this activity. Listening for 8 seconds…';render();
};
function duration(){return $('duration').value==='custom'?Math.max(1,Math.min(60,Number($('custom').value)||5))*60:Number($('duration').value);}
function reset(){warnings.reset();game=E.create(duration(),Number($('threshold').value));lastStatus='';lastBand=-1;render();}
$('preset').onchange=()=>{const goal=goals[$('preset').value];$('threshold').value=goal?.threshold??E.presets[$('preset').value].threshold;$('calibrationStatus').textContent=goal?'Using this activity’s calibrated goal.':'Calibrate using an acceptable sound level for this activity.';reset();};
$('duration').onchange=()=>{$('customWrap').hidden=$('duration').value!=='custom';reset();};
$('custom').onchange=()=>{$('custom').value=duration()/60;reset();};
$('threshold').oninput=()=>{goals[$('preset').value]={threshold:Number($('threshold').value)};$('calibrationStatus').textContent='Sound goal adjusted. Watch the live meter to check it.';reset();};
$('settings').onclick=()=>settings(document.body.classList.contains('classroom-mode'));
$('start').onclick=()=>{if(!live()&&!calibration.active&&family.ready){if(!mic.active){announce('Enable microphone before starting.');settings(true);return;}warnings.reset();game=E.create(duration(),Number($('threshold').value));lastStatus='';E.start(game);settings(false);render();}};
$('pause').onclick=()=>{warnings.stop();if(game.status==='paused'){if(!mic.active){announce('Enable microphone before resuming.');settings(true);return;}E.resume(game);settings(false);}else{E.pause(game);mic.stop('Paused. Enable microphone before resuming.');settings(true);}render();};
$('reset').onclick=()=>{cancelCalibration('Calibration cancelled.');mic.stop();settings(true);reset();announce('Ready for a new quest. Completed naps are retained for this session.');};
$('motion').onclick=()=>{motionPaused=!motionPaused;document.body.classList.toggle('no-motion',motionPaused);$('motion').setAttribute('aria-pressed',motionPaused);$('motion').textContent=motionPaused?'Resume character motion':'Pause character motion';};
const warningText=()=>{$('warningToggle').setAttribute('aria-pressed',warnings.enabled);$('warningToggle').textContent=warnings.enabled?'Mute whimper warnings':'Enable whimper warnings';};
$('warningToggle').onclick=async()=>{if(warnings.enabled){warnings.disable();$('warningStatus').textContent='Warnings off.';}else{try{$('warningToggle').disabled=true;await warnings.enable();$('warningStatus').textContent='Warnings on. At least 20 seconds between soft cues.';}catch{warnings.disable();$('warningStatus').textContent='Sound could not start. Try again; visual cues still work.';}finally{$('warningToggle').disabled=false;}}warningText();};
$('warningTest').onclick=()=>{if(!live()&&!calibration.active&&warnings.play(performance.now()/1000))$('warningStatus').textContent='Playing a sample whimper.';};
$('warningVolume').oninput=()=>{warnings.volume=Number($('warningVolume').value)/100;$('warningVolumeText').textContent=$('warningVolume').value+'%';if(warnings.volume===0)warnings.stop();};
window.addEventListener('pagehide',()=>{calibration.cancel();mic.stop();warnings.disable();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){warnings.stop();E.pause(game);mic.stop('Microphone stopped because the tab was hidden. Enable again when ready.');settings(true);render();}});
function render(){
 const status=game.status,band=game.wake>=100?4:game.wake>=70?3:game.wake>=45?2:game.wake>=20?1:0;
 const names=['Peaceful','Stirring','Wriggling','Almost awake','Nap interrupted'];
 const labels={ready:'Ready for a quest',countdown:'Getting cosy…',playing:names[band],paused:'Paused for instructions',won:'Quest complete — playtime!',lost:'Nap interrupted'};
 $('state').textContent=labels[status];$('activity').textContent=E.presets[$('preset').value].name;
 const seconds=Math.ceil(game.remaining);$('timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 $('wake').value=game.wake;$('wakeText').textContent=names[band]+' · '+Math.round(game.wake)+'%';
 $('banner').textContent=status==='countdown'?'Get ready · '+Math.ceil(game.countdown):status==='won'?'You did it! Time to stretch and play.':status==='lost'?'Let’s try a quieter nap.':status==='paused'?'The quest is paused.':status==='ready'?'Help us earn our playtime!':names[band];
 $('hint').textContent=status==='playing'?(band>=2?'Quieter now… sustained quiet helps the pups settle.':'Stay below your sound goal to protect their nap.'):status==='won'?'You protected their whole nap. Enjoy your well-earned playtime!':status==='lost'?'The sound stayed too loud. A fresh quest is ready when you are.':status==='paused'?'Enable the microphone, then resume. Your progress is saved.':'The family settles during a 10-second countdown. Focus time starts afterwards.';
 $('start').disabled=!family.ready||live()||!mic.active||calibration.active;$('start').textContent=['won','lost'].includes(status)?'Start another quest':'Start quest';
 $('pause').disabled=!live()||(status==='paused'&&!mic.active);$('pause').textContent=status==='paused'?'Resume quest':'Pause for instructions';
 $('device').disabled=live()||mic.pending||mic.active||calibration.active;$('enableMic').disabled=mic.pending||mic.active;$('stopMic').disabled=!mic.pending&&!mic.active;
 $('calibrate').disabled=live()||!mic.active;$('calibrate').textContent=calibration.active?'Cancel calibration':'Calibrate this activity';
 $('warningTest').disabled=live()||calibration.active||!warnings.enabled;
 if(status==='playing'&&warnings.gate.protected(performance.now()/1000))$('banner').textContent='A gentle warning · focus time briefly held';
 $('gain').disabled=live()||calibration.active;$('liveMeter').value=mic.level;$('liveText').textContent=Math.round(mic.level);$('inputBadge').textContent=mic.active?'MICROPHONE ON':'MICROPHONE OFF';
 for(const id of ['preset','duration','custom','threshold'])$(id).disabled=live()||calibration.active;
 $('thresholdText').textContent=$('threshold').value;
 document.body.dataset.status=status;document.body.dataset.band=band;
 if(lastStatus!==status){
  if(status==='won'){winCount++;earned+=game.duration;$('wins').textContent=winCount+' peaceful nap'+(winCount===1?'':'s');$('minutes').textContent=Math.round(earned/60*10)/10+' focus minutes earned';}
  if(['won','lost'].includes(status)){warnings.stop();mic.stop('Quest finished. Microphone off. Enable it for the next quest.');if(status==='lost')settings(true);}
  announce(labels[status]);lastStatus=status;
 }else if(status==='playing'&&lastBand!==band)announce(names[band]+'. '+$('hint').textContent);
 lastBand=band;
}
function frame(now){let dt=(now-previous)/1000;previous=now;
 if(dt>2){cancelCalibration('Calibration interrupted. Keep this tab open and try again.');if(['playing','countdown'].includes(game.status)){E.pause(game);mic.stop('Device interruption. Enable microphone again.');settings(true);}dt=0;}
 if(!document.hidden){dt=Math.min(dt,2);const elapsed=dt,time=now/1000;
  if(game.status==='playing')warnings.update(game.wake,time);
  const guarded=warnings.gate.protected(time),input=mic.sample(dt,Number($('gain').value));
  if(calibration.active){const result=calibration.update(dt,input);if(result){if(result.error)$('calibrationStatus').textContent=result.error;else{goals[$('preset').value]=result;$('threshold').value=result.threshold;game.threshold=result.threshold;$('calibrationStatus').textContent='Goal set to '+result.threshold+' for '+E.presets[$('preset').value].name+'. Adjust below if needed.';}}else $('calibrationStatus').textContent='Make an acceptable working sound · '+Math.max(1,Math.ceil(8-calibration.elapsed))+' seconds left';}
  if(guarded){mic.level=0;dt=0;}
  while(dt>0){const slice=Math.min(.05,dt);E.step(game,slice,input);dt-=slice;}
  render();family.draw(game,elapsed,motionPaused);
 }requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
