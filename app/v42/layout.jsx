"use client";

import * as THREE from "three";

const proto=THREE.BufferGeometry.prototype;
if(!proto.__livingOrbNormalsReturnGeometry){
  const original=proto.computeVertexNormals;
  proto.computeVertexNormals=function(...args){
    original.apply(this,args);
    return this;
  };
  Object.defineProperty(proto,"__livingOrbNormalsReturnGeometry",{value:true,configurable:false,enumerable:false});
}

export default function V42Layout({children}){
  return children;
}
