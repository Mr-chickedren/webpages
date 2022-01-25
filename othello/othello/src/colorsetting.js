
let outer = document.getElementById('outer');

let colorBack = document.getElementById('colorBack');
colorBack.value = "#111010";
colorBack.addEventListener('change', function(){
    outer.style.background = this.value;
});

let colorFore = document.getElementById('colorFore');
colorFore.value = "#ffffff";
colorFore.addEventListener('change', function(){
    outer.style.color = this.value;
});

