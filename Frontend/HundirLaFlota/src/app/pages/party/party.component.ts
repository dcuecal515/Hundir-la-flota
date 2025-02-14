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
    const dropzone = document.getElementById('dropzone');
    const draggable = document.getElementById('barco4');
    draggable.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', draggable.id);
      console.log('Estoy arrastrando mi elemento');
    });
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
