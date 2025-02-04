import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebsocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'HundirLaFlota';
  type:'rxjs'
  constructor(private webSocketService:WebsocketService){
    console.log("HOLA FUNCIONO");
    if(localStorage.getItem("token") || sessionStorage.getItem("token"))
      console.log("Entro si tengo sesion iniciada")
      if(!this.webSocketService.isConnectedRxjs()){
        console.log("Entro si no estoy conectado")
        this.connectRxjs()
      }
  }
  connectRxjs() {
    this.type = 'rxjs';
    this.webSocketService.connectRxjs();
  }
}
