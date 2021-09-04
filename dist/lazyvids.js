(configObj=>{if(window.NodeList&&!NodeList.prototype.forEach){NodeList.prototype.forEach=Array.prototype.forEach}document.addEventListener("DOMContentLoaded",(()=>{const config={logLevel:configObj&&configObj.logLevel?configObj.logLevel:"silent",ignoreHidden:configObj&&configObj.ignoreHidden?configObj.ignoreHidden:false,minBandwidth:configObj&&configObj.minBandwidth?Number.parseFloat(configObj.minBandwidth):0,reduceData:configObj&&configObj.reduceData?configObj.reduceData:false,requirePoster:configObj&&configObj.requirePoster?configObj.requirePoster:true};const log=(message,object="")=>{if(config.logLevel!=="verbose")return;window.console.log(`lazyvids: ${message}`,object)};const warn=(message,object="")=>{if(config.logLevel==="silent")return;window.console.warn(`lazyvids: ${message}`,object)};const supportsIntersectionObserver=typeof window.IntersectionObserver==="function";let intersectionObserver;if(config.reduceData&&config.minBandwidth&&navigator.connection&&navigator.connection.downlink&&(navigator.connection.downlink<config.minBandwidth||navigator.connection.saveData)){warn(`Slow connection (${navigator.connection.downlink}mbps). Lazy autoplay disabled.`);return}const playVideo=video=>{video.playsinline=true;video.muted=true;video.autoplay=true;if(video.play()!==undefined){video.play().then((()=>video.dataset.lazyvids="loaded")).catch((error=>warn(`Autoplay blocked by browser for:`,video)))}else{video.dataset.lazyvids="loaded"}};const isVisible=element=>{if(element.style&&element.style.display&&element.style.display==="none")return false;if(config.ignoreHidden&&element.style&&element.style.visibility&&element.style.visibility==="hidden")return false;const styles=getComputedStyle(element);const display=styles.getPropertyValue("display");if(display==="none")return false;if(config.ignoreHidden){const visibility=styles.getPropertyValue("visibility");if(visibility==="hidden")return false}if(element.parentNode&&element.parentNode!==document)return isVisible(element.parentNode);return true};const handleIntersection=(entries,intersectionObserver)=>{entries.forEach((entry=>{window.requestAnimationFrame((()=>{const target=entry.target;if(entry.isIntersecting===false)return;if(isVisible(target)===false)return;playVideo(target);intersectionObserver.unobserve(target)}))}))};if(supportsIntersectionObserver){intersectionObserver=new IntersectionObserver(handleIntersection)}const process=video=>{if(config.requirePoster&&(video.poster===undefined||video.poster==="")){playVideo(video);warn(`Video missing poster image. Lazy autoplay disabled for:`,video);return}if(supportsIntersectionObserver===false){playVideo(video);warn(`Unsupported browser. Lazy autoplay disabled.`);return}video.dataset.lazyvids="unloaded";intersectionObserver.observe(video)};const domSelector="video[data-lazyvids]:not([data-lazyvids=loaded])";const lazyVideos=document.querySelectorAll(domSelector);log(`Initialised — ${lazyVideos.length} ${lazyVideos.length===1?"video":"videos"} detected`);lazyVideos.forEach((video=>process(video)));const handleMutation=mutationsList=>{mutationsList.forEach((mutation=>{mutation.addedNodes.forEach((node=>{if(node.tagName==="VIDEO"&&node.dataset.lazyvids!==undefined&&node.dataset.lazyvids!=="loaded"){process(node);return}if(node.hasChildNodes()===false)return;const nestedLazyvids=node.querySelectorAll(domSelector);if(nestedLazyvids.length===0)return;nestedLazyvids.forEach((videoNode=>process(videoNode)))}))}))};const mutationConfig={childList:true,subtree:true};const mutationObserver=new MutationObserver(handleMutation);mutationObserver.observe(document,mutationConfig)}))})(window.lazyvidsConfig||{});