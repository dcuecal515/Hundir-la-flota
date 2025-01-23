import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket,WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  path="";
  connected = new Subject<void>();
  private onConnected() {
    console.log('Socket connected');
    this.connected.next();
  }
  rxjsSocket: WebSocketSubject<string>;

  connectRxjs() {
    console.log("me conecto")
    console.log("ESTA ES MI URL: ",environment.socketUrllocal+localStorage.getItem("token"))
    if(localStorage.getItem("token")){
      this.path=environment.socketUrllocal+localStorage.getItem("token")
    }
    if(sessionStorage.getItem("token")){
      this.path=environment.socketUrllocal+sessionStorage.getItem("token")
    }
    console.log("mi token: "+localStorage.getItem("token"))
    console.log("mi url: "+this.path)
    this.rxjsSocket = webSocket({
      
      url: this.path,

      // Evento de apertura de conexión
      openObserver: {
        next: () => this.onConnected()
      }
    })

    this.rxjsSocket.subscribe({
      // Evento de mensaje recibido
      next: (message: string) => console.log(message),

      // Evento de error generado
      /*error: (error) => this.onError(error),

      // Evento de cierre de conexión
      complete: () => this.onDisconnected()*/
    });
  }
}
