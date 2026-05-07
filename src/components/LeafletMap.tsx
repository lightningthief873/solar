/**
 * Self-contained tile map — no CDN, no API key.
 * Renders OSM tiles via <img> in a WebView, handles markers + pin placement.
 */
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { RARITY_CONFIG } from '../utils/constants';
import type { Drop } from '../types';

const EMOJI: Record<Drop['rarity'], string> = {
  common: '🌿', rare: '💎', legendary: '🔥', mythic: '🌟',
};

function buildHtml(userLat: number, userLng: number, drops: Drop[], allowPin: boolean): string {
  const dropsJson = JSON.stringify(
    drops.map(d => ({
      id: d.id, lat: d.lat, lng: d.lng,
      name: d.name.replace(/'/g, "\\'"),
      rarity: d.rarity,
      color: RARITY_CONFIG[d.rarity].color,
      emoji: EMOJI[d.rarity],
    })),
  );

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body,html{margin:0;padding:0;background:#1C1C1E;overflow:hidden;font-family:sans-serif}
#map{position:relative;width:100vw;height:100vh;overflow:hidden;cursor:crosshair;user-select:none}
.t{position:absolute;width:256px;height:256px}
.mk{position:absolute;transform:translate(-50%,-100%);cursor:pointer;text-align:center;z-index:10;pointer-events:auto}
.me{display:block;font-size:24px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9))}
.ml{display:block;font-size:10px;font-weight:700;background:rgba(0,0,0,0.88);padding:2px 7px;border-radius:7px;margin-top:2px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ud{position:absolute;width:18px;height:18px;background:#0A84FF;border:3px solid #fff;border-radius:50%;transform:translate(-50%,-50%);z-index:20;box-shadow:0 0 0 6px rgba(10,132,255,0.25)}
.pop{position:absolute;background:#1C1C1E;border:1px solid #3A3A3C;border-radius:16px;padding:16px;min-width:170px;z-index:30;box-shadow:0 8px 32px rgba(0,0,0,0.9);transform:translate(-50%,-110%)}
.pn{color:#fff;font-size:16px;font-weight:800;margin:0 0 4px}
.pm{font-size:12px;font-weight:700;margin:0 0 12px}
.pb{background:#0A84FF;color:#fff;border:none;border-radius:10px;padding:10px;font-size:14px;font-weight:700;width:100%;cursor:pointer}
.pin-marker{position:absolute;transform:translate(-50%,-100%);z-index:25;font-size:32px;pointer-events:none}
.zoom-ctrl{position:absolute;right:12px;bottom:32px;display:flex;flex-direction:column;background:rgba(0,0,0,0.8);border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.15);z-index:40}
.zb{width:40px;height:40px;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.zd{height:1px;background:rgba(255,255,255,0.15)}
</style>
</head><body>
<div id="map"></div>
<script>
var TILE=256,Z=17;
var clat=${userLat},clng=${userLng};
var drops=${dropsJson};
var allowPin=${allowPin ? 'true' : 'false'};
var W=window.innerWidth,H=window.innerHeight;
var pinMk=null,openPop=null;

function l2t(lat,z){var s=Math.sin(lat*Math.PI/180);return(1-Math.log((1+s)/(1-s))/(2*Math.PI))/2*Math.pow(2,z);}
function g2t(lng,z){return((lng+180)/360)*Math.pow(2,z);}
function t2lat(ty,z){var n=Math.PI-2*Math.PI*ty/Math.pow(2,z);return 180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));}
function t2lng(tx,z){return tx/Math.pow(2,z)*360-180;}

var mapEl=document.getElementById('map');

function render(){
  var keep=[];
  // remove tiles, keep markers/popups/user dot/pin
  Array.from(mapEl.children).forEach(function(c){
    if(c.classList.contains('t'))c.remove();
    else keep.push(c);
  });

  var cx=g2t(clng,Z),cy=l2t(clat,Z);
  var tx0=Math.floor(cx),ty0=Math.floor(cy);
  var ox=(cx-tx0)*TILE,oy=(cy-ty0)*TILE;
  var rx=Math.ceil(W/TILE/2)+2,ry=Math.ceil(H/TILE/2)+2;
  var max=Math.pow(2,Z)-1;
  var frag=document.createDocumentFragment();
  for(var dy=-ry;dy<=ry;dy++){for(var dx=-rx;dx<=rx;dx++){
    var ttx=tx0+dx,tty=ty0+dy;
    if(ttx<0||tty<0||ttx>max||tty>max)continue;
    var img=document.createElement('img');
    img.className='t';
    var sub=['a','b','c'][Math.abs(ttx+tty)%3];
    img.src='https://'+sub+'.tile.openstreetmap.org/'+Z+'/'+ttx+'/'+tty+'.png';
    img.style.left=(W/2-ox+dx*TILE)+'px';
    img.style.top=(H/2-oy+dy*TILE)+'px';
    frag.appendChild(img);
  }}
  mapEl.insertBefore(frag,mapEl.firstChild);
  positionExtras();
}

function positionExtras(){
  var cx=g2t(clng,Z),cy=l2t(clat,Z);
  // user dot
  var ud=document.getElementById('ud');
  if(ud){ud.style.left=W/2+'px';ud.style.top=H/2+'px';}
  // markers
  document.querySelectorAll('[data-drop-id]').forEach(function(m){
    var lat=parseFloat(m.dataset.lat),lng=parseFloat(m.dataset.lng);
    var px=W/2+(g2t(lng,Z)-cx)*TILE;
    var py=H/2+(l2t(lat,Z)-cy)*TILE;
    m.style.left=px+'px';m.style.top=py+'px';
    m.style.display=(px<-60||px>W+60||py<-60||py>H+60)?'none':'block';
  });
  // pin marker
  if(pinMk){
    var plat=parseFloat(pinMk.dataset.lat),plng=parseFloat(pinMk.dataset.lng);
    var ppx=W/2+(g2t(plng,Z)-cx)*TILE;
    var ppy=H/2+(l2t(plat,Z)-cy)*TILE;
    pinMk.style.left=ppx+'px';pinMk.style.top=ppy+'px';
  }
}

function init(){
  mapEl.innerHTML='';
  // User dot
  var ud=document.createElement('div');
  ud.className='ud';ud.id='ud';
  ud.style.left=W/2+'px';ud.style.top=H/2+'px';
  mapEl.appendChild(ud);

  // Drop markers
  drops.forEach(function(d){
    var m=document.createElement('div');
    m.className='mk';m.dataset.dropId=d.id;
    m.dataset.lat=d.lat;m.dataset.lng=d.lng;
    m.innerHTML='<span class="me">'+d.emoji+'</span><span class="ml" style="color:'+d.color+';border:1.5px solid '+d.color+'">'+d.name+'</span>';
    m.onclick=function(e){e.stopPropagation();showPopup(d,m);};
    mapEl.appendChild(m);
  });

  // Zoom controls
  var zc=document.createElement('div');zc.className='zoom-ctrl';
  zc.innerHTML='<button class="zb" onclick="zoom(1)">+</button><div class="zd"></div><button class="zb" onclick="zoom(-1)">−</button>';
  mapEl.appendChild(zc);

  render();

  // Touch pan
  var touch0=null;
  mapEl.addEventListener('touchstart',function(e){touch0={x:e.touches[0].clientX,y:e.touches[0].clientY,lat:clat,lng:clng};},true);
  mapEl.addEventListener('touchmove',function(e){
    if(!touch0||e.touches.length!==1)return;
    e.preventDefault();
    var dx=e.touches[0].clientX-touch0.x;
    var dy=e.touches[0].clientY-touch0.y;
    var scale=360/Math.pow(2,Z)/TILE;
    clng=touch0.lng-dx*scale;
    var ty=l2t(touch0.lat,Z)-dy/TILE;
    clat=t2lat(ty,Z);
    render();
  },{passive:false});

  // Tap for pin
  if(allowPin){
    mapEl.addEventListener('click',function(e){
      if(e.target.closest&&(e.target.closest('.mk')||e.target.closest('.pop')||e.target.closest('.zoom-ctrl')))return;
      if(openPop){closePop();return;}
      var cx=g2t(clng,Z),cy=l2t(clat,Z);
      var tx=cx+(e.clientX-W/2)/TILE;
      var ty=cy+(e.clientY-H/2)/TILE;
      var lat=t2lat(ty,Z),lng=t2lng(tx,Z);
      placePin(lat,lng);
      send({type:'pin',lat:lat,lng:lng});
    });
  } else {
    mapEl.addEventListener('click',function(e){
      if(openPop&&!(e.target.closest&&e.target.closest('.pop'))){closePop();}
    });
  }
}

function showPopup(d,markerEl){
  closePop();
  var pop=document.createElement('div');
  pop.className='pop';
  pop.innerHTML='<p class="pn">'+d.name+'</p><p class="pm" style="color:'+d.color+'">'+d.rarity.toUpperCase()+'</p><button class="pb" onclick="selDrop(\''+d.id+'\')">Select Drop</button>';
  pop.style.left=markerEl.style.left;
  pop.style.top=markerEl.style.top;
  mapEl.appendChild(pop);
  openPop=pop;
}
function closePop(){if(openPop){openPop.remove();openPop=null;}}

function placePin(lat,lng){
  if(pinMk)pinMk.remove();
  pinMk=document.createElement('div');
  pinMk.className='pin-marker';pinMk.textContent='📍';
  pinMk.dataset.lat=lat;pinMk.dataset.lng=lng;
  mapEl.appendChild(pinMk);
  positionExtras();
}

window.selDrop=function(id){send({type:'selectDrop',id:id});};
window.zoom=function(d){Z=Math.max(12,Math.min(19,Z+d));render();};

function send(obj){
  try{window.ReactNativeWebView.postMessage(JSON.stringify(obj));}catch(e){}
}

init();
</script>
</body></html>`;
}

export interface LeafletMapHandle {
  updateDrops: (drops: Drop[]) => void;
}

interface Props {
  drops: Drop[];
  userLat: number;
  userLng: number;
  style?: object;
  allowPin?: boolean;
  onDropSelect?: (drop: Drop) => void;
  onPinPlaced?: (lat: number, lng: number) => void;
}

export const LeafletMap = forwardRef<LeafletMapHandle, Props>(
  ({ drops, userLat, userLng, style, allowPin = false, onDropSelect, onPinPlaced }, ref) => {
    const webRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      updateDrops: () => {},
    }));

    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data) as { type: string; id?: string; lat?: number; lng?: number };
          if (msg.type === 'selectDrop' && msg.id && onDropSelect) {
            const drop = drops.find(d => d.id === msg.id);
            if (drop) onDropSelect(drop);
          }
          if (msg.type === 'pin' && msg.lat != null && msg.lng != null && onPinPlaced) {
            onPinPlaced(msg.lat, msg.lng);
          }
        } catch {}
      },
      [drops, onDropSelect, onPinPlaced],
    );

    const html = buildHtml(userLat, userLng, drops, !!allowPin);

    return (
      <View style={[styles.wrap, style]}>
        <WebView
          ref={webRef}
          source={{ html }}
          style={styles.web}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          originWhitelist={['*']}
          scrollEnabled={false}
          overScrollMode="never"
          cacheEnabled={false}
          thirdPartyCookiesEnabled={false}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#1C1C1E' },
  web: { flex: 1, backgroundColor: '#1C1C1E' },
});
