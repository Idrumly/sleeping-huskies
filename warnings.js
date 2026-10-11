(function(root){
 'use strict';
 class WarningGate {
  constructor(){this.reset();}
  reset(){this.armed=true;this.last=-Infinity;this.guardUntil=0;}
  due(wake,now){if(wake<20)this.armed=true;return this.armed&&wake>=45&&now-this.last>=20;}
  played(now){this.armed=false;this.last=now;this.guardUntil=now+2.8;}
  protected(now){return now<this.guardUntil;}
 }
 class PuppyWarnings {
  constructor(env){this.env=env;this.enabled=false;this.nodes=[];this.gate=new WarningGate();this.volume=.18;this.generation=0;}
  async enable(){const token=++this.generation;const C=this.env.AudioContext||this.env.webkitAudioContext;if(!C)throw Error('Audio unavailable');if(!this.ctx||this.ctx.state==='closed')this.ctx=new C();await this.ctx.resume();if(token!==this.generation)return false;if(this.ctx.state!=='running')throw Error('Audio blocked');this.enabled=true;return true;}
  stop(){for(const n of this.nodes){try{n.stop();}catch{}try{n.disconnect();}catch{}}this.nodes=[];if(this.output){this.output.disconnect();this.output=null;}}
  disable(){this.generation++;this.enabled=false;this.stop();const ctx=this.ctx;this.ctx=null;if(ctx)ctx.close().catch(()=>{});}
  reset(){this.stop();this.gate.reset();}
  play(now){if(!this.enabled||this.ctx?.state!=='running'||this.volume<=0)return false;this.stop();const ctx=this.ctx,t=ctx.currentTime;const output=ctx.createGain();this.output=output;output.gain.value=this.volume*.22;output.connect(ctx.destination);
   // Original synthesized puppy-like whine: two soft, breathy pitch glides.
   for(const [offset,length,pitch] of [[0,.55,620],[.68,.42,700]]){
    const amp=ctx.createGain();amp.connect(output);amp.gain.setValueAtTime(0,t+offset);amp.gain.linearRampToValueAtTime(1,t+offset+.08);amp.gain.exponentialRampToValueAtTime(.01,t+offset+length);amp.gain.linearRampToValueAtTime(0,t+offset+length+.03);
    const osc=ctx.createOscillator();osc.type='triangle';osc.frequency.setValueAtTime(pitch,t+offset);osc.frequency.exponentialRampToValueAtTime(pitch*1.35,t+offset+.16);osc.frequency.exponentialRampToValueAtTime(pitch*.72,t+offset+length);osc.connect(amp);osc.start(t+offset);osc.stop(t+offset+length+.04);osc.onended=()=>{osc.disconnect();amp.disconnect();};this.nodes.push(osc);
   }
   this.gate.played(now);return true;
  }
  update(wake,now){if(this.gate.due(wake,now))return this.play(now);return false;}
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={WarningGate,PuppyWarnings};else root.PuppyWarnings=PuppyWarnings;
})(globalThis);
