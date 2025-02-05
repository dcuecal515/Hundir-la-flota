import { Component } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment.development';
import { Request } from '../../models/Request';
import { RequestService } from '../../services/request.service';
import { User } from '../../models/user';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FriendRequest } from '../../models/FriendRequest';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchmakingComponent {
  constructor(private webSocketService:WebsocketService,private requestService:RequestService,private router:Router,private dataService:DataService){
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
  ngOnInit(): void {
      this.messageReceived$ = this.webSocketService.messageReceived.subscribe(message => {
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
        if(message.message=="Has sido eliminado de amigos"){
          console.log("Te eliminaron")
          const newFriendList = this.friendList.filter(friend => friend.nickName !== message.nickName);
          this.friendList = newFriendList;
        }
        if(message.message=="usuarios conectados"){
          console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
          this.conectedUsers=message.quantity
          this.dataService.players=message.quantity
        }
        if(message.message=="usuarios desconectados"){
          console.log("HOLAAAA")
          console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
          this.conectedUsers=message.quantity
          this.dataService.players=message.quantity
        }
        this.serverResponse = message
      });
    }
    backToTheMenu(){
      this.router.navigateByUrl("menu");
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
    }
    playGameRamdon(){
      const message:FriendRequest={TypeMessage:"Buscando Partida"}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
    }
    ngOnDestroy(): void {
      this.messageReceived$.unsubscribe();
    }
}
