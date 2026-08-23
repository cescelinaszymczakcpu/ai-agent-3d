'use client';

import { useMemo } from 'react';

export const presets = {
  femaleAurora: {name:'Female Aurora',gender:'female',primary:'#25D9FF',secondary:'#9B4DFF',accent:'#FF70CF',eyes:true,eyeStyle:'soft',eyeColor:'#8E7CFF',hair:true,hairStyle:'light-wave',hairColor:'#B06CFF',mustache:false,beard:false,mouth:false,limbWidth:0.72,armLength:1,legLength:1,glass:0.88,glow:0.78,opacity:0.84,voicePreset:'aurora'},
  femaleAqua: {name:'Female Aqua',gender:'female',primary:'#46E8FF',secondary:'#35BFFF',accent:'#A8FFF0',eyes:true,eyeStyle:'minimal',eyeColor:'#3A74FF',hair:true,hairStyle:'short',hairColor:'#6DF2FF',mustache:false,beard:false,mouth:false,limbWidth:0.7,armLength:1,legLength:1.04,glass:0.9,glow:0.7,opacity:0.82,voicePreset:'liquid-wave'},
  femaleMinimal:{name:'Female Minimal',gender:'female',primary:'#B3E9FF',secondary:'#866BFF',accent:'#F5F7FF',eyes:false,eyeStyle:'light',eyeColor:'#FFFFFF',hair:false,hairStyle:'none',hairColor:'#FFFFFF',mustache:false,beard:false,mouth:false,limbWidth:0.62,armLength:.96,legLength:1,glass:.94,glow:.52,opacity:.76,voicePreset:'minimal'},
  maleAzure:{name:'Male Azure',gender:'male',primary:'#28D8FF',secondary:'#6D5BFF',accent:'#FF77D5',eyes:true,eyeStyle:'soft',eyeColor:'#79A7FF',hair:false,hairStyle:'none',hairColor:'#89CFFF',mustache:true,mustacheStyle:'classic',mustacheColor:'#9276FF',beard:false,mouth:false,limbWidth:.74,armLength:1,legLength:1,glass:.9,glow:.72,opacity:.84,voicePreset:'energy-ring'},
  maleNoMustache:{name:'Male No Mustache',gender:'male',primary:'#26C9FF',secondary:'#5F6CFF',accent:'#9BF7FF',eyes:true,eyeStyle:'futuristic',eyeColor:'#8BE9FF',hair:true,hairStyle:'crest',hairColor:'#63D7FF',mustache:false,beard:false,mouth:false,limbWidth:.7,armLength:1,legLength:1,glass:.91,glow:.68,opacity:.83,voicePreset:'neural-flow'},
  neutral:{name:'Neutral Orb',gender:'neutral',primary:'#5CE8FF',secondary:'#9B6CFF',accent:'#FF86E2',eyes:false,eyeStyle:'light',eyeColor:'#FFFFFF',hair:false,hairStyle:'none',hairColor:'#FFFFFF',mustache:false,beard:false,mouth:false,limbWidth:.66,armLength:.95,legLength:.98,glass:.92,glow:.76,opacity:.81,voicePreset:'calm-medical'}
};

export const voicePresets = ['soft-pulse','liquid-wave','aurora','spiral','plasma','energy-ring','breathing-light','ripple','neural-flow','cosmic','minimal','calm-medical'];

export const hairStyles = ['light-wave','short','long-wave','bun','none','contour','crest'];
export const eyeStyles = ['soft','minimal','futuristic','realistic','light'];
export const mustacheStyles = ['classic','fine','handlebar','minimal'];

export function LivingOrb({config,state='idle',audioLevel=0.22,large=true}){
  const vars = useMemo(()=>({
    '--p':config.primary,'--s':config.secondary,'--a':config.accent,
    '--hair':config.hairColor || config.accent,'--eye':config.eyeColor || '#fff','--mustache':config.mustacheColor || config.secondary,
    '--orb-opacity':config.opacity,'--glow':config.glow,'--glass':config.glass,
    '--limb-width':`${config.limbWidth || .7}`,'--arm-length':`${config.armLength || 1}`,'--leg-length':`${config.legLength || 1}`,
    '--audio':Math.max(.05,Math.min(1,audioLevel))
  }),[config,audioLevel]);

  return <div className={`livingCharacter ${large?'livingLarge':''} state-${state} gender-${config.gender}`} style={vars}>
    <div className="livingBody">
      <div className="limb arm left"><i className="hand"/></div>
      <div className="limb arm right"><i className="hand"/></div>
      <div className="limb leg left"><i className="foot"/></div>
      <div className="limb leg right"><i className="foot"/></div>

      <div className="orbShell">
        <div className="orbGlow"/>
        <div className="orbGlass"/>
        <div className="orbDepth depthA"/><div className="orbDepth depthB"/><div className="orbDepth depthC"/>
        <div className={`voiceOrb preset-${config.voicePreset}`}><i/><i/><i/><i/></div>
        <div className="orbHighlight"/>

        {config.hair && config.hairStyle!=='none' && <Hair styleName={config.hairStyle}/>} 
        {config.eyes && <Eyes styleName={config.eyeStyle}/>} 
        {config.mustache && <Mustache styleName={config.mustacheStyle || 'classic'}/>} 
        {config.beard && <div className="beard"/>}
        {config.mouth && <div className="mouth"/>}
      </div>
    </div>
  </div>;
}

function Eyes({styleName}){
  return <div className={`livingEyes eye-${styleName}`}><span className="eyeL"><i/></span><span className="eyeR"><i/></span></div>;
}
function Hair({styleName}){ return <div className={`livingHair hair-${styleName}`}><i/><i/><i/></div>; }
function Mustache({styleName}){ return <div className={`livingMustache moustache-${styleName}`}><i/><i/></div>; }
