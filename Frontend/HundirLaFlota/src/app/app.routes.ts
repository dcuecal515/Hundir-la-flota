import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MenuComponent } from './pages/menu/menu.component';
import { MatchmakingComponent } from './pages/matchmaking/matchmaking.component';
import { PartyComponent } from './pages/party/party.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
    {path:'',component:HomeComponent},
    {path:'login',component:LoginComponent},
    {path:'menu',component:MenuComponent},
    {path:'matchmaking',component:MatchmakingComponent},
    {path:'game',component:PartyComponent},
    {path:'profile/:id',component:ProfileComponent}
];
