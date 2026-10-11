(function(root){
 'use strict';
 function levelFromSamples(samples,gain=1){let sum=0;for(const x of samples)sum+=x*x;const rms=Math.sqrt(sum/samples.length);return Math.max(0,Math.min(100,(20*Math.log10(Math.max(1e-8,rms)*gain)+60)/60*100));}
 class Microphone {
  constructor(env,onStatus){this.env=env;this.onStatus=onStatus;this.generation=0;this.active=false;this.pending=false;this.level=0;}
  stop(message='Microphone off.'){this.generation++;this.active=false;this.pending=false;this.level=0;if(this.stream){for(const t of this.stream.getTracks()){t.onended=null;t.onmute=null;t.stop();}}this.stream=null;if(this.source)this.source.disconnect();this.source=null;const ctx=this.context;this.context=null;if(ctx){ctx.onstatechange=null;ctx.close().catch(()=>{});}this.onStatus(message);}
  async start(deviceId=''){
   this.stop();const token=this.generation;this.pending=true;this.onStatus('Waiting for microphone permission…');
   try{
    if(!this.env.isSecureContext||!this.env.navigator.mediaDevices?.getUserMedia)throw {name:'Unsupported'};
    const Context=this.env.AudioContext||this.env.webkitAudioContext;if(!Context)throw {name:'Unsupported'};
    const ctx=new Context();this.context=ctx;await ctx.resume();if(token!==this.generation)return;
    const stream=await this.env.navigator.mediaDevices.getUserMedia({video:false,audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,...(deviceId?{deviceId:{exact:deviceId}}:{})}});
    if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
    this.stream=stream;const track=stream.getAudioTracks().find(t=>t.readyState==='live');if(!track)throw {name:'NotFoundError'};
    if(ctx.state!=='running')throw {name:'AudioSuspended'};
    this.source=ctx.createMediaStreamSource(stream);this.analyser=ctx.createAnalyser();this.analyser.fftSize=2048;this.source.connect(this.analyser);this.samples=new Float32Array(this.analyser.fftSize);
    track.onended=()=>this.stop('Microphone disconnected. Reconnect it and enable again.');track.onmute=()=>this.stop('Microphone input interrupted. Enable again to retry.');
    ctx.onstatechange=()=>{if(this.active&&ctx.state!=='running')this.stop('Audio processing paused. Enable microphone again.');};
    this.pending=false;this.active=true;this.onStatus('Listening: '+(track.label||'selected microphone')+'. No recording or upload.');
   }catch(e){if(token!==this.generation)return;const messages={NotAllowedError:'Microphone permission blocked. Allow it in Chrome site controls, then retry.',NotFoundError:'No microphone found. Check the webcam connection, then retry.',NotReadableError:'Microphone unavailable. Close other apps using it and retry.',OverconstrainedError:'Selected microphone is unavailable. Choose Default microphone and retry.',Unsupported:'Microphone needs a supported browser on localhost or HTTPS.',AudioSuspended:'Audio processing did not start. Click Enable microphone to retry.'};this.stop(messages[e.name]||'Could not start microphone. Check the device and retry.');}
  }
  sample(dt,gain){if(!this.active)return 0;this.analyser.getFloatTimeDomainData(this.samples);const target=levelFromSamples(this.samples,gain);this.level+=(target-this.level)*(1-Math.exp(-Math.max(0,dt)/.2));return this.level;}
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={Microphone,levelFromSamples};else root.HuskyMicrophone=Microphone;
})(globalThis);
