(function(){
  var s=document.currentScript, src=s.src, n=6, i=0, acc="";
  function pad(i){return (i<10?"0":"")+i}
  function dec(b64){
    var bin=atob(b64.replace(/\s+/g,"")), arr=new Uint8Array(bin.length);
    for(var j=0;j<bin.length;j++) arr[j]=bin.charCodeAt(j);
    return new TextDecoder("utf-8").decode(arr);
  }
  function next(){
    if(i>=n){var e=document.createElement("script");e.text=acc;s.parentNode.insertBefore(e,s.nextSibling);return}
    fetch(src+".b64."+pad(i++)).then(function(r){if(!r.ok)throw new Error(r.status);return r.text()}).then(function(t){acc+=dec(t);next()});
  }
  next();
})();
