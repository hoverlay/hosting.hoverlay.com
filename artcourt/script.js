const hours = new Date().getHours()
const isDayTime = hours > 7 && hours < 21

if (isDayTime) 
  window.location.href = "https://hoverlay.io/space/ic2"
else
  window.location.href = "https://hoverlay.io/space/f46ov"
