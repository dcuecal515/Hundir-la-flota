import { Component } from '@angular/core';
import { AuthserviceService } from '../../services/authservice.service';
import { Router } from '@angular/router';
import { WebsocketService } from '../../services/websocket.service';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { RequestService } from '../../services/request.service';
import { User } from '../../models/user';
import { jwtDecode } from 'jwt-decode';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Userinformation } from '../../models/userinformation';
import { environment } from '../../../environments/environment';
import { Userchangerole } from '../../models/userchangerole';
import { FriendRequest } from '../../models/FriendRequest';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.css'
})

export class AdministrationComponent {
  constructor(private authService:AuthserviceService,private router:Router,private webSocketService:WebsocketService, private dataService: DataService,private apiService:ApiService,private requestService:RequestService){
      if(localStorage.getItem("token")){
              this.decoded=jwtDecode(localStorage.getItem("token"));
            }else if(sessionStorage.getItem("token")){
              this.decoded=jwtDecode(sessionStorage.getItem("token"));
            }else{
              router.navigateByUrl("/login")
              this.decoded=null
            }
      if(this.decoded.role!="Admin"){
        router.navigateByUrl("/not-found")
      }
      this.getallusers()
  }
  decoded:User
  routeParamMap$: Subscription | null = null;
  messageReceived$:Subscription;
  disconnected$: Subscription;
  isConnected: boolean = false;
  usersarray:Userinformation[]=[]
  isRedirecting: boolean = false;

  ngOnInit(): void {
      console.log(this.decoded.nickName)
      this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
        if(message.message=="amigo conectado"){
          console.log("HOLAAAA")
          console.log("Ahora tu amigo se ha conectado:"+message.friendId)
          this.dataService.players=message.quantity
          this.dataService.playersPlaying=message.quantityplayer
          this.dataService.games=message.quantitygame
        }
        if(message.message=="usuarios conectados"){
          console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
          this.dataService.players=message.quantity
          this.dataService.playersPlaying=message.quantityplayer
          this.dataService.games=message.quantitygame
        }
        if(message.message=="usuarios desconectados"){
          console.log("HOLAAAA")
          console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
          this.dataService.players=message.quantity
          this.dataService.playersPlaying=message.quantityplayer
          this.dataService.games=message.quantitygame
        }
        if(message.message=="amigo desconectado"){
          console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
          this.dataService.players=message.quantity
        }
      });
      this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
    }
    async getallusers(){
      const users=await this.authService.getallusers()
      users.forEach(user => {
        user.avatar=environment.images+user.avatar
      });
      this.usersarray=users
      console.log("Hola:",this.usersarray);
    }
    async changeRol(iduser:number,roleuser:string){
      if(roleuser=="User"){
        const UserChange:Userchangerole={id:iduser,role:"Admin"}
        const result=await this.authService.changerole(UserChange)
        if(result.success){
          console.log("Hola")
          this.usersarray.forEach(user => {
            if(user.id==iduser){
              user.role="Admin"
            }
          });
        }
      }
      if(roleuser=="Admin"){
        const UserChange:Userchangerole={id:iduser,role:"User"}
        const result=await this.authService.changerole(UserChange)
        if(result.success){
          this.usersarray.forEach(user => {
            if(user.id==iduser){
              user.role="User"
            }
          });
        }
      }
    }
    banUser(id:number){
        if (id != null) {
          const User:FriendRequest={TypeMessage:"Baneando jugador" ,Identifier: id.toString(),Identifier2:null}
          // Convertir el objeto a JSON
          const jsonData = JSON.stringify(User);
          console.log(JSON.stringify(User));
          this.webSocketService.sendRxjs(jsonData);
          this.usersarray.forEach(user => {
            if(user.id==id){
              user.ban="Si"
            }
          });
        }
      }
    async quitBanUser(id:number){
      const result=await this.authService.quitBan(id)
      if(result.success){
        this.usersarray.forEach(user => {
          if(user.id==id){
            user.ban="No"
          }
        });
      }
    }
    ngOnDestroy(): void {
      this.messageReceived$.unsubscribe();
      this.disconnected$.unsubscribe();
    }
}
