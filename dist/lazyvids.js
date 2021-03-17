(configObj=>{if(window.NodeList&&!NodeList.prototype.forEach){NodeList.prototype.forEach=Array.prototype.forEach}document.addEventListener("DOMContentLoaded",(()=>{const config={logLevel:configObj&&configObj.logLevel?configObj.logLevel:"silent",ignoreHidden:configObj&&configObj.ignoreHidden?configObj.ignoreHidden:false,minBandwidth:configObj&&configObj.minBandwidth?Number.parseFloat(configObj.minBandwidth):0,reduceData:configObj&&configObj.reduceData?configObj.reduceData:false,requirePoster:configObj&&configObj.requirePoster?configObj.requirePoster:true};const log=(message,object)=>{if(config.logLevel!=="verbose")return;object?window.console.log(`lazyvids: ${message}`,object):window.console.log(`lazyvids: ${message}`)};const warn=(message,object)=>{if(config.logLevel==="silent")return;object?window.console.warn(`lazyvids: ${message}`,object):window.console.warn(`lazyvids: ${message}`)};const hasIo=typeof window.intersectionObserver===undefined||typeof window.intersectionObserver==="undefined"?false:true;let intersectionObserver;if(config.reduceData&&config.minBandwidth&&navigator.connection&&navigator.connection.downlink&&(navigator.connection.downlink<config.minBandwidth||navigator.connection.saveData)){warn(`Slow connection (${navigator.connection.downlink}mbps). Lazy autoplay disabled.`);return}const playVideo=video=>{video.setAttribute("playsinline","");video.setAttribute("muted","");video.setAttribute("autoplay","");video.play();video.setAttribute("data-lazyvids","loaded")};const isVisible=element=>{if(element.style&&element.style.display&&element.style.display==="none")return false;if(config.ignoreHidden&&element.style&&element.style.visibility&&element.style.visibility==="hidden")return false;const styles=getComputedStyle(element);const display=styles.getPropertyValue("display");if(display==="none")return false;if(config.ignoreHidden){const visibility=styles.getPropertyValue("visibility");if(visibility==="hidden")return false}if(element.parentNode&&element.parentNode!==document)return isVisible(element.parentNode);return true};const handleIntersection=(entries,intersectionObserver)=>{entries.forEach((entry=>{window.requestAnimationFrame((()=>{const target=entry.target;if(entry.isIntersecting===false)return;if(isVisible(target)===false)return;playVideo(target);intersectionObserver.unobserve(target)}))}))};if(hasIo){intersectionObserver=new IntersectionObserver(handleIntersection)}const process=video=>{if(config.requirePoster&&(video.poster===undefined||video.poster==="")){playVideo(video);warn(`Video missing poster image. Lazy autoplay disabled for:`,video);return}if(hasIo===false){playVideo(video);warn(`Unsupported browser. Lazy autoplay disabled.`);return}video.setAttribute("data-lazyvids","unloaded");intersectionObserver.observe(video)};const selector="video[data-lazyvids]:not([data-lazyvids=loaded])";const lazyVideos=document.querySelectorAll(selector);log(`Initialised — ${lazyVideos.length} ${lazyVideos.length===1?"video":"videos"} detected`);lazyVideos.forEach((video=>process(video)));const handleMutation=mutationsList=>{mutationsList.forEach((mutation=>{mutation.addedNodes.forEach((node=>{if(node.tagName!=="VIDEO"||node.dataset.lazyvids===undefined||node.dataset.lazyvids==="loaded")return;process(node)}))}))};const mutationConfig={childList:true,subtree:true};const mutationObserver=new MutationObserver(handleMutation);mutationObserver.observe(document,mutationConfig)}))})(window.lazyvidsConfig||{});