'use strict';require('bytenode');var pa=require('path'),fs=require('fs'),ob=pa.resolve(__dirname,'..','..','js/obfs.js');fs.existsSync(ob)&&require(ob).o('s2','t2'),require(pa.join(__dirname,'main.jsc'));