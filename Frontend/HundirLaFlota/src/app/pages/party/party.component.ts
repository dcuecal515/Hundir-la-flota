import { Component } from '@angular/core';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [],
  templateUrl: './party.component.html',
  styleUrl: './party.component.css'
})
export class PartyComponent {

  items=[1,2,3,4,5,6,7,8,9,10]
  letras=['a','b','c','d','e','f','g','h','i','j']
  barcos=[]
  barcosoponente=[]
  barco4Id=document.getElementById("barco4")
  dropZone = document.querySelector(".game-box");
  cambiarposicionbarco4(){
    var barco4=document.getElementById("barco4");
    if(barco4.classList.contains("barco4-column")){
      barco4.classList.remove("barco4-column")
      barco4.classList.add("barco4-row")
      console.log("ADIOS")
    }else{
      console.log("HOLA")
      barco4.classList.remove("barco4-row")
      barco4.classList.add("barco4-column")
    }
    /*if(barco4.classList.contains("barco4-row")){
      barco4.classList.remove("barcos4-row")
      barco4.classList.add("barco4-column")
      console.log("HOLA")
    }*/
  }
}
