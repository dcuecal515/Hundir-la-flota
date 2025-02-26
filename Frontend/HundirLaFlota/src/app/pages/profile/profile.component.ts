import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserReceived } from '../../models/UserReceived';
import { AuthserviceService } from '../../services/authservice.service';
import { jwtDecode } from 'jwt-decode';
import { User } from '../../models/user';
import { DataService } from '../../services/data.service';
import { FriendRequest } from '../../models/FriendRequest';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment.development';
import { FullUserReceived } from '../../models/FullUserReceived';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  constructor(private authService:AuthserviceService,private router:Router,private webSocketService:WebsocketService,private activatedRoute: ActivatedRoute, private dataService: DataService,private apiService:ApiService){
    if(localStorage.getItem("token")){
            this.decoded=jwtDecode(localStorage.getItem("token"));
          }else if(sessionStorage.getItem("token")){
            this.decoded=jwtDecode(sessionStorage.getItem("token"));
          }else{
            this.decoded=null
          }
  }

  decoded:User
  routeParamMap$: Subscription | null = null;
  user:FullUserReceived | null = null;
  messageReceived$:Subscription;
  isMyProfile:boolean = false;
  newImage:File | null = null;

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
      if(message.message=="Cambiado el nombre con exito"){
        console.log("Nombre cambiado con exito")
        this.user.nickName=message.nickName
      }
      if(message.message=="No te puedes poner ese nombre"){
        console.log("Nombre no valido")
        Swal.fire({
          title: 'Apodo no disponible',
          icon: 'error',
          timer: 1000, 
          showConfirmButton: false
        });
      }
      if(message.message=="Cambiado el email con exito"){
        this.user.email=message.nickName
      }
      if(message.message=="No te puedes poner ese email"){
        Swal.fire({
          title: 'Email no disponible',
          icon: 'error',
          timer: 1000, 
          showConfirmButton: false
        });
      }
    });
    this.getUser()
  }

  async getUser() {

    this.routeParamMap$ = this.activatedRoute.paramMap.subscribe(async paramMap => {
      const id = paramMap.get('id') as unknown as number;
      if(this.decoded.id != id){
        this.isMyProfile=false
      }else{
        console.log("Mi perfil")
        this.isMyProfile=true
      }
      const result = await this.authService.getFullUserById(id)
      if (result != null) {
        console.log("entro")
        this.user = result
        console.log("Usuario: ", this.user)
      }
      else{
        console.log("no entro")
      }
      
    });
  }

  changeNickName(){
    const nickNameInput = document.getElementById("nickName") as HTMLInputElement
    const nickName = nickNameInput.value
    if(nickName!=""){
      const messageToSend:FriendRequest={TypeMessage:"Solicitud cambio de nombre",Identifier:nickName}
      const jsonData = JSON.stringify(messageToSend)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)     
      nickNameInput.value = ""
    }else{
      console.log("no cambio nombre")
    }
  }

  changeEmail(){
    const emailInput = document.getElementById("email") as HTMLInputElement
    const email = emailInput.value
    if(email!=""){
      const messageToSend:FriendRequest={TypeMessage:"Solicitud cambio de email",Identifier:email}
      const jsonData = JSON.stringify(messageToSend)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)     
      emailInput.value = ""
    }else{
      console.log("no cambio nombre")
    }

  }

  changeOrTakeOffImage(){
    Swal.fire({
      title: 'Editar avatar',
      html: `
        <input type="file" id="avatarInput" accept="image/png, image/jpeg, image/jpg" class="swal2-input">
        <button id="changeImageButton" class="swal2-confirm swal2-styled">Cambiar imagen</button>
        <button id="removeImageButton" class="swal2-cancel swal2-styled">Quitar imagen</button>
      `,
      showCancelButton: false,
      showConfirmButton: false,
      didOpen: () => {
        const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
        const changeBtn = document.getElementById('changeImageButton') as HTMLButtonElement;
        const removeBtn = document.getElementById('removeImageButton') as HTMLButtonElement;

        fileInput.addEventListener('change', (event: Event) => {
          this.onFileSelected(event);
        });

        changeBtn.addEventListener('click', () => {
          this.changeImage();
          Swal.close();
        });

        removeBtn.addEventListener('click', () => {
          this.takeOffImage();
          Swal.close();
        });
      }
    });
  }

  onFileSelected(event: any){
    const image = event.target.files[0] as File;
    if(image){
      console.log(image)
      this.newImage=image;
    }else{
      console.log("No hay imagen")
    }
  }

  async changeImage(){
    const result = await this.authService.changeImageservice(this.newImage)
    this.user.avatar=environment.images+result.data.image
  }

  async takeOffImage(){
    this.newImage==null
    const result = await this.authService.changeImageservice(this.newImage)
    this.user.avatar=environment.images+result.data.image
  }



  async changePassword(){
    const passwordInput = document.getElementById("password") as HTMLInputElement
    const repeatPasswordInput = document.getElementById("repeat-password") as HTMLInputElement
    const password = passwordInput.value
    const repeatPassword = repeatPasswordInput.value
    if(password != "" && repeatPassword != ""){
      if(password==repeatPassword){
        const result=await this.authService.changepassword(password)
        if(result.success){
          this.apiService.deleteToken();
          this.webSocketService.disconnectRxjs();
          this.router.navigateByUrl("login");
        }
      }else{
        Swal.fire({
          title: 'Las contraseñas no son iguales',
          icon: 'error',
          timer: 1000, 
          showConfirmButton: false
        });
      }
    }else{
      Swal.fire({
        title: 'No dejes los campos vacios',
        icon: 'error',
        timer: 1000, 
        showConfirmButton: false
      });
    }

  }

}
