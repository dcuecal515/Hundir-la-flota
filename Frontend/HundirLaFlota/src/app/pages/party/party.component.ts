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

  guardarposicion(letra:string,item:number){
    var miposicion
    var gamebox=document.getElementById("game-box")
    gamebox.classList.remove("game-box")
    gamebox.classList.add("game-box-view")
    miposicion=letra+item
    console.log(miposicion)
  }
}
