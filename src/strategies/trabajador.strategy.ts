import { AuthenticationStrategy } from "@loopback/authentication";
import { service } from "@loopback/core";
import { HttpErrors,Request } from "@loopback/rest";
import { UserProfile } from "@loopback/security";
import parseBearerToken from "parse-bearer-token";
import { AutenticacionService } from "../services";
export class EstrategiaTrabajador implements AuthenticationStrategy{
    name: string ='trabajador';
constructor(
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
){

}   
   
   
    async authenticate(request:Request): Promise<UserProfile | undefined>{
        let token = parseBearerToken(request);
        if(token){
            let datos= this.servicioAutenticacion.validarToken(token);
            if(datos.nombreRol==='trabajador'){
                
        let perfil: UserProfile = Object.assign({
            nombre:datos.data.nombre
           //más bien
           //nombrerol.datos.data.nombrerol,

                });
                return perfil;
        
    }else {
        throw new HttpErrors[401]("Token no válido")
    }
}else{
    throw new HttpErrors[401]("no se ha incluido un token")
}
    } 
        
}
