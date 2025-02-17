import { Component,AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [],
  templateUrl: './party.component.html',
  styleUrl: './party.component.css'
})
export class PartyComponent implements AfterViewInit {

  items=[1,2,3,4,5,6,7,8,9,10]
  letras=['a','b','c','d','e','f','g','h','i','j']
  barcos=[]
  barcosoponente=[]
  ngAfterViewInit() {
    const dropzones = document.querySelectorAll('.game-box');
    const draggablebarco4 = document.getElementById('barco4');
    draggablebarco4.addEventListener('dragstart', (event) => {
      console.log(event)
      const altura=event.offsetY
      console.log('La posición del clic (altura) dentro del div es:', altura);
      console.log('Altura total del div:', draggablebarco4.offsetHeight);
      event.dataTransfer.setData('text/plain', draggablebarco4.id);
      console.log('Estoy arrastrando mi elemento');
    });
    dropzones.forEach(dropzone => {
      dropzone.addEventListener("dragover", (ev:DragEvent) => ev.preventDefault());
      dropzone.addEventListener("drop", (ev:DragEvent) => {
        const idelemento = ev.dataTransfer.getData("text/plain");
        const item = document.querySelector("#" + idelemento);
        const Idsuelto=dropzone.id
        const elemento=document.getElementById(Idsuelto)
        const padre=document.getElementById(idelemento)
        const hijos=padre.children
        const clase=padre.className
        
        console.log("MI ID ES: ",idelemento)
        console.log("Mis hijos son",hijos)
        console.log("Mi clase del padre",clase)
        console.log('posicon donde he soltado mi barco', Idsuelto);
        elemento.style.backgroundColor = 'grey';
        elemento.style.border = '';
        dropzone.append(item)
        draggablebarco4.draggable=false
      });
    });
    /*dropzone.addEventListener("dragover", (ev) => ev.preventDefault());
    dropzone.addEventListener("drop", (ev) => {
      const id = ev.dataTransfer.getData("text/plain");
      const item = document.querySelector("#" + id);
      dropzone.append(item);
    });*/
  }
  cambiarposicionbarco4(){
    var barco4=document.getElementById("barco4");
    if(barco4.classList.contains("barco4-column")){
      barco4.classList.remove("barco4-column")
      barco4.classList.add("barco4-row")
    }else{
      barco4.classList.remove("barco4-row")
      barco4.classList.add("barco4-column")
    }
  }
}
