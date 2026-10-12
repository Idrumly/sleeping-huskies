'use strict';
const E=window.HuskyEngine,$=id=>document.getElementById(id);
let game=E.create(),sound=15,pulse=0,winCount=0,earned=0,previous=performance.now(),lastStatus='',lastBand=-1,motionPaused=false;
const live=()=>['countdown','playing','paused'].includes(game.status);
const isMic=()=>$('inputMode').value==='mic';
const warnings=new window.PuppyWarnings(window);
const family=new window.HuskyFamily($('family'),message=>{$('artStatus').textContent=message;},()=>{$('artStatus').textContent='They wake one at a time: Pup 1, Pup 2, Pup 3, then Mom. Quiet helps them settle.';});
const warningText=()=>{ $('warningToggle').setAttribute('aria-pressed',warnings.enabled);$('warningToggle').textContent=warnings.enabled?'Mute whimper warnings':'Enable whimper warnings';$('warningTest').disabled=!warnings.enabled;};
$('warningToggle').onclick=async()=>{if(warnings.enabled){warnings.disable();$('warningStatus').textContent='Warnings off. Visual cues remain available.';}else{try{$('warningToggle').disabled=true;await warnings.enable();$('warningStatus').textContent='Warnings on. One soft cue when wriggling begins; at least 20 seconds between warnings.';}catch{warnings.disable();$('warningStatus').textContent='Sound could not start. Try Enable again; visual cues still work.';}finally{$('warningToggle').disabled=false;}}warningText();};
$('warningTest').onclick=()=>{if(!live()&&warnings.play(performance.now()/1000))$('warningStatus').textContent='Playing a sample whimper. Adjust the volume to suit your room.';};
$('warningVolume').oninput=()=>{warnings.volume=Number($('warningVolume').value)/100;$('warningVolumeText').textContent=$('warningVolume').value+'%';if(warnings.volume===0)warnings.stop();};
const mic=new window.HuskyMicrophone(window,message=>{ $('micStatus').textContent=message;if(!mic.active&&isMic())E.pause(game); });
async function refreshDevices(){try{const selected=$('device').value;const devices=await navigator.mediaDevices.enumerateDevices();$('device').replaceChildren(new Option('Default microphone',''));for(const d of devices.filter(d=>d.kind==='audioinput'))$('device').add(new Option(d.label||'Microphone',d.deviceId));if([...$('device').options].some(o=>o.value===selected))$('device').value=selected;}catch{/* Default input still works if enumeration is unavailable. */}}
$('enableMic').onclick=async()=>{const pending=mic.start($('device').value);render();await pending;if(mic.active)await refreshDevices();render();};
$('stopMic').onclick=()=>{mic.stop();render();};
$('device').onchange=()=>{mic.stop('Input changed. Enable microphone to use this device.');render();};
$('inputMode').onchange=()=>{mic.stop();winCount=0;earned=0;$('wins').textContent='0 peaceful naps';$('minutes').textContent='0 focus seconds earned';$('micControls').hidden=!isMic();$('demoControls').hidden=isMic();reset();};
$('gain').oninput=()=>{$('gainText').textContent=$('gain').value+'×';};
window.addEventListener('pagehide',()=>{mic.stop();warnings.disable();});
function duration(){return $('duration').value==='custom'?Math.max(1,Math.min(60,Number($('custom').value)||5))*60:Number($('duration').value);}
function announce(text){$('announcement').textContent=text;}
function reset(){warnings.reset();game=E.create(duration(),Number($('threshold').value));pulse=0;lastStatus='';lastBand=-1;render();}
function setSound(n){sound=n;pulse=0;$('sound').value=n;render();}
$('preset').onchange=()=>{ $('threshold').value=E.presets[$('preset').value].threshold;reset();};
$('duration').onchange=()=>{$('customWrap').hidden=$('duration').value!=='custom';reset();};
$('custom').onchange=()=>{$('custom').value=duration()/60;reset();};
$('threshold').oninput=reset;
$('sound').oninput=()=>setSound(Number($('sound').value));
$('quiet').onclick=()=>setSound(10);
$('loud').onclick=()=>setSound(95);
$('cough').onclick=()=>{pulse=.6;render();};
$('start').onclick=()=>{if(!live()){if(isMic()&&!mic.active){announce('Enable microphone before starting.');return;}warnings.reset();game=E.create(duration(),Number($('threshold').value));pulse=0;lastStatus='';E.start(game);render();}};
$('pause').onclick=()=>{if(game.status==='paused'){if(isMic()&&!mic.active){announce('Enable microphone before resuming.');return;}E.resume(game);}else{E.pause(game);if(isMic())mic.stop('Paused. Enable microphone before resuming.');}render();};
$('reset').onclick=()=>{mic.stop();reset();announce('Round reset. Test scores for this session are retained.');};
$('motion').onclick=()=>{motionPaused=!motionPaused;document.body.classList.toggle('no-motion',motionPaused);$('motion').setAttribute('aria-pressed',motionPaused);$('motion').textContent=motionPaused?'Resume character motion':'Pause character motion';};
document.addEventListener('visibilitychange',()=>{if(document.hidden){warnings.stop();E.pause(game);mic.stop('Microphone stopped because the tab was hidden. Enable again when ready.');render();announce('Paused because this tab was hidden. Resume when you are ready.');}});
function render(){
 const status=game.status,band=game.wake>=100?4:game.wake>=70?3:game.wake>=45?2:game.wake>=20?1:0;
 const names=['Peaceful','Stirring','Wriggling','Almost awake','Awake'];
 const endingWakeUp=status==='lost'&&family.tracks[0].frame<47;
 const labels={ready:'Ready for a nap',countdown:'Settling in…',playing:names[band],paused:'Paused for instructions',won:'A peaceful nap!',lost:endingWakeUp?'Too loud - the family is waking...':'Game Over - nap time is over!'};
 $('state').textContent=labels[status];$('activity').textContent=E.presets[$('preset').value].name;
 const seconds=Math.ceil(game.remaining);$('timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 $('wake').value=game.wake;$('wakeText').textContent=names[band]+' · '+Math.round(game.wake)+'%';
 $('banner').textContent=status==='countdown'?'Settle in · '+Math.ceil(game.countdown):status==='won'?'Nap complete. Well done!':status==='lost'?(endingWakeUp?'One by one... Mom wakes last.':'A little quieter next time. Try another nap.'):status==='paused'?'Take your time. The challenge is paused.':status==='ready'?'A little quiet. A lovely long nap.':names[band];
 $('hint').textContent=status==='playing'?(band>=2?'Quieter now… give the pups a chance to settle.':'Keep the sound below your goal to protect their nap.'):status==='won'?'Challenge complete. Start another nap whenever you’re ready.':status==='lost'?'Sustained noise filled the wake-up meter. Try returning to quiet sooner.':status==='paused'?'Time and restlessness are frozen. Resume includes a settling countdown.':'Brief noises cause a small stir. Sustained noise gradually wakes the family.';
 $('start').disabled=!family.ready||live()||(isMic()&&!mic.active);$('start').textContent=['won','lost'].includes(status)?'Try another nap':'Start nap';$('pause').disabled=!live()||(status==='paused'&&isMic()&&!mic.active);$('pause').textContent=status==='paused'?'Resume challenge':'Pause for instructions';
 $('inputMode').disabled=live();$('device').disabled=live()||mic.pending||mic.active;$('enableMic').disabled=mic.pending||mic.active;$('stopMic').disabled=!mic.pending&&!mic.active;
 $('warningTest').disabled=live()||!warnings.enabled;
 if(isMic()&&game.status==='playing'&&warnings.gate.protected(performance.now()/1000))$('banner').textContent='A gentle warning · focus time briefly held';
 $('gain').disabled=live();$('liveMeter').value=mic.level;$('liveText').textContent=Math.round(mic.level);$('inputBadge').textContent=isMic()?(mic.active?'LIVE MICROPHONE · LISTENING':'MICROPHONE · OFF'):'DEMO · NO MICROPHONE';
 for(const id of ['preset','duration','custom','threshold'])$(id).disabled=live();
 const displayed=pulse>0?100:sound;$('soundText').textContent=displayed;$('soundFill').style.width=displayed+'%';$('thresholdText').textContent=$('threshold').value;$('thresholdMarker').style.left=$('threshold').value+'%';
 document.body.dataset.status=status;document.body.dataset.band=band;
 const visibleBand=family.ready&&family.timeline.awake.some(Boolean)?3:game.wake>=45?2:game.wake>=20?1:0;
 document.querySelectorAll('[data-pose]').forEach(el=>el.classList.toggle('active',Number(el.dataset.pose)===visibleBand));
 if(lastStatus!==status){if(status==='won'){winCount++;earned+=game.duration;$('wins').textContent=winCount+' peaceful nap'+(winCount===1?'':'s');$('minutes').textContent=earned+' focus seconds earned';}if(['won','lost'].includes(status))mic.stop('Round finished. Microphone off.');announce(labels[status]+(status==='playing'?'. Keep the family asleep.':'. Test session only; no classroom scores saved.'));lastStatus=status;}else if(status==='playing'&&lastBand!==band)announce(names[band]+'. '+$('hint').textContent);
 if(lastStatus!==status||status==='paused'||status==='lost'||status==='won')warnings.stop();
 if(status==='lost'){const message=labels.lost+'. Test session only; no classroom scores saved.';if($('announcement').textContent!==message)announce(message);}
 lastBand=band;
}
function frame(now){let dt=(now-previous)/1000;previous=now;
 if(dt>2&&['playing','countdown'].includes(game.status)){E.pause(game);mic.stop('Device interruption. Enable microphone again.');render();announce('Paused after a device interruption. Resume when you are ready.');dt=0;}
 if(!document.hidden){dt=Math.min(dt,2);const elapsed=dt,time=now/1000;
  if(game.status==='playing'&&warnings.update(game.wake,time))$('warningStatus').textContent='The pups are wriggling. A little quieter will help them settle.';
  const guarded=isMic()&&warnings.gate.protected(time);const input=isMic()?mic.sample(dt,Number($('gain').value)):null;
  if(guarded){mic.level=0;dt=0;}
  while(dt>0){const slice=Math.min(.05,dt);E.step(game,slice,isMic()?input:pulse>0?100:sound);if(game.status==='playing')pulse=Math.max(0,pulse-slice);dt-=slice;}render();family.draw(game,elapsed,motionPaused);
  if(family.ready)document.querySelectorAll('[data-animal]').forEach(el=>{const row=Number(el.dataset.animal),frame=family.tracks[row].frame,awake=frame>=HuskyTransition.EYES_OPEN;const state=awake?'Awake':frame>=16&&frame<=31?'Yawning':row===0&&frame>=32?'Covering ears':frame>0?'Stirring':'Asleep';const text=el.querySelector('strong');if(text.textContent!==state)text.textContent=state;el.classList.toggle('awake',awake);});
 }requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
