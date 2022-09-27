// Rotate through 4 experiences, changing each day
var now = new Date();
var start = new Date(now.getFullYear(), 0, 0);
var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
var oneDay = 1000 * 60 * 60 * 24;
var day = Math.floor(diff / oneDay);

// Calculate index to change every day, over 4 days
var experience_index = day % 4

switch (experience_index) {
  case 0:
    window.location.href = "https://hoverlay.io/space/10853"
    break;
  case 1:
    window.location.href = "https://hoverlay.io/space/048"
    break;
  case 2:
    window.location.href = "https://hoverlay.io/space/8347"  
    break;
  case 3:
    window.location.href = "https://hoverlay.io/space/40958"    
    break;
  default:
    window.location.href = "https://hoverlay.io/space/10853"
}