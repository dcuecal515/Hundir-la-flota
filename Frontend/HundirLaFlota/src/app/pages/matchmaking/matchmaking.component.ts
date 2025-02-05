import { Component } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment.development';
import { Request } from '../../models/Request';
import { RequestService } from '../../services/request.service';
import { User } from '../../models/user';
import { jwtDecode } from 'jwt-decode';
import { FriendRequest } from '../../models/FriendRequest';
import { DataService } from '../../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchmakingComponent {
  constructor(private webSocketService:WebsocketService,private requestService:RequestService,private dataService:DataService){
    if(localStorage.getItem("token")){
          this.decoded=jwtDecode(localStorage.getItem("token"));
        }else if(sessionStorage.getItem("token")){
          this.decoded=jwtDecode(sessionStorage.getItem("token"));
        }else{
          this.decoded=null
        }
    this.url=environment.images+this.decoded.Avatar;
  }
  conectedUsers:number = 0
  isConnected: boolean = false;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  requestList:Request[] = []
  userList:Friend[]
  friendList:Friend[] = []
  serverResponse: string = '';
  gamemode:string;
  decoded:User;
  url:string
  partyRequestSended:string[] = []

  ngOnInit(): void {
    window.addEventListener('beforeunload', () => {
      this.partyRequestSended.forEach(nickName => {
        const message:FriendRequest={TypeMessage:"sala finalizada",Identifier:nickName}
        const jsonData = JSON.stringify(message)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      });
    });
      this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
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
        if(message.message=="amigo desconectado"){
          console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
          this.friendList.forEach(friend => {
            if(friend.id == message.friendId){
              friend.status="Desconectado"
            }
          });
          this.conectedUsers=message.quantity
        }
        if(message.message=="Has recibido una solicitud de partida"){
          console.log("Solicitud de partida de "+message.nickName)
          const playRequest = await Swal.fire({
                                  title: "Solicitud de partida",
                                  text: message.nickName+" te a invitado a jugar",
                                  icon: "info",
                                  showCancelButton: true,
                                  confirmButtonText: "Aceptar",
                                  cancelButtonText: "Cerrar"
                                });
                                if (playRequest.isConfirmed) {
                                  Swal.fire("Confirmado", "Entrando a partida", "success");
                                  const messageToSend:FriendRequest={TypeMessage:"Aceptar Partida",Identifier:message.nickName}
                                  const jsonData = JSON.stringify(messageToSend)
                                  console.log(jsonData)
                                  this.webSocketService.sendRxjs(jsonData)
                                } else {
                                  const messageToSend:FriendRequest={TypeMessage:"Rechazar Partida",Identifier:message.nickName}
                                  const jsonData = JSON.stringify(messageToSend)
                                  console.log(jsonData)
                                  this.webSocketService.sendRxjs(jsonData)
                                }
        }

        this.serverResponse = message
      });
    }
    gameBot(){
      this.gamemode="partywithbot";
    }
    gameFriend(){
      this.gamemode="partywithfriend";
      this.recievFriend()
    }
    gameRamdon(){
      this.gamemode="partywithrandom";
    }
    async recievFriend(){
      var result = await this.requestService.receiveFriend()
      console.log(result.data)
      if(result.data != null){
        result.data.forEach(friend => {
          friend.avatar = environment.images+friend.avatar
          if(friend.status=="Conectado"){
            this.friendList.push(friend);
          }
        });
      }
    }
    playgame(){
      
    }
    sendInvite(nickName){
      const message:FriendRequest={TypeMessage:"solicitud de partida",Identifier:nickName}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      this.partyRequestSended.push(nickName);
    }
    ngOnDestroy(): void {
      this.messageReceived$.unsubscribe();
      this.partyRequestSended.forEach(nickName => {
        const message:FriendRequest={TypeMessage:"sala finalizada",Identifier:nickName}
        const jsonData = JSON.stringify(message)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      });
    }
}
