(function(){
  var s=document.currentScript, src=s.src, n=6, i=0, acc="";
  function pad(i){return (i<10?"0":"")+i}
  function next(){
    if(i>=n){
      acc=acc.replace(/"object"==typeof document\?document\.currentScript:void 0/g,"({src:"+JSON.stringify(src)+"})");
      var e=document.createElement("script");
      e.text=acc;
      s.parentNode.insertBefore(e,s.nextSibling);
      return;
    }
    fetch(src+".part"+pad(i++)).then(function(r){if(!r.ok)throw new Error(r.status);return r.text()}).then(function(t){acc+=t;next()});
  }
  next();
})();
