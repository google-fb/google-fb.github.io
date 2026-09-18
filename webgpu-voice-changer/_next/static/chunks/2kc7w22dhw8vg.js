(function(){
  var s=document.currentScript, src=s.src, n=20, i=0, acc="";
  function pad(i){return (i<10?"0":"")+i}
  function dec(b64){
    var bin=atob(b64.replace(/\s+/g,"")), arr=new Uint8Array(bin.length);
    for(var j=0;j<bin.length;j++) arr[j]=bin.charCodeAt(j);
    return new TextDecoder("utf-8").decode(arr);
  }
  function next(){
    if(i>=n){
      acc=acc.replace(/"object"==typeof document\?document\.currentScript:void 0/g,"({src:"+JSON.stringify(src)+"})");
      var e=document.createElement("script");
      e.text=acc;
      s.parentNode.insertBefore(e,s.nextSibling);
      return;
    }
    fetch(src+".b64."+pad(i++)).then(function(r){if(!r.ok)throw new Error(r.status);return r.text()}).then(function(t){acc+=dec(t);next()});
  }
  next();
})();
