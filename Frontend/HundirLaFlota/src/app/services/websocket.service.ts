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
  messageReceived = new Subject<any>();
  disconnected = new Subject<void>();

  private onConnected() {
    console.log('Socket connected');
    this.connected.next();
  }
  private onMessageReceived(message: string) {
    console.log("Mensaje recivido: ",message)
    
    this.messageReceived.next(message);
  }

  private onError(error: any) {
    console.error('Error:', error);
  }

  private onDisconnected() {
    console.log('WebSocket connection closed');
    this.disconnected.next();
  }
  rxjsSocket: WebSocketSubject<any>;

  isConnectedRxjs() {
    return this.rxjsSocket && !this.rxjsSocket.closed;
  }

  connectRxjs() {
    console.log("me conecto")
    console.log(localStorage.getItem("token"))
    if(localStorage.getItem("token")){
      this.path=environment.socketUrllocal+localStorage.getItem("token")
    }
    if(sessionStorage.getItem("token")){
      this.path=environment.socketUrllocal+sessionStorage.getItem("token")
    }
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
      next: (message: any) => this.onMessageReceived(message),

      // Evento de error generado
      error: (error) => this.onError(error),

      // Evento de cierre de conexión
      complete: () => this.onDisconnected()
    });
  }
  sendRxjs(message: string) {
    this.rxjsSocket.next(message);
  }

  disconnectRxjs() {
    console.log("FUNCIONO");
    this.rxjsSocket.complete();
    this.rxjsSocket = null;
  }
}
