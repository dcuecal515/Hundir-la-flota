import { Component } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchmakingComponent {
  constructor(private webSocketService:WebsocketService){}
  conectedUsers:number = 0
  isConnected: boolean = false;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  requestList:Request[] = []
  userList:Friend[]
  friendList:Friend[] = []
  serverResponse: string = '';
   ngOnInit(): void {
      this.messageReceived$ = this.webSocketService.messageReceived.subscribe(message => {
        if(message.message=="Has recibido una solicitud de amistad"){
          console.log("amistad")
          this.requestList.push(message)
        }
        if(message.message=="Te rechazaron"){
          console.log("rechazo")
        }
        if(message.message=="Añadido a lista de amigos"){
          console.log("nuevo amigo")
          message.avatar = environment.images+message.avatar
          this.friendList.push(message)
        }
        if(message.message=="Has sido eliminado de amigos"){
          console.log("Te eliminaron")
          const newFriendList = this.friendList.filter(friend => friend.nickName !== message.nickName);
          this.friendList = newFriendList;
        }
        if(message.message=="amigo conectado"){
          console.log("HOLAAAA")
          console.log("Ahora tu amigo se ha conectado:"+message.friendId)
          this.friendList.forEach(friend => {
            if(friend.id == message.friendId){
              friend.status="Conectado"
            }
          });
          this.conectedUsers=message.quantity
        }
        if(message.message=="usuarios conectados"){
          console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
          this.conectedUsers=message.quantity
        }
        if(message.message=="usuarios desconectados"){
          console.log("HOLAAAA")
          console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
          this.conectedUsers=message.quantity
        }
        if(message.message=="amigo desconectado"){
          console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
          this.friendList.forEach(friend => {
            if(friend.id == message.friendId){
              friend.status="Desconectado"
            }
          });
          this.conectedUsers=message.quantity
        }
        this.serverResponse = message
      });
      /*this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);*/
      // Pide los amigos que tiene el usuario
      // this.friendList = JSON.parse(this.serverResponse);*/
    }
    ngOnDestroy(): void {
      this.messageReceived$.unsubscribe();
    }
}
