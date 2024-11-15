export interface IUserRegistration {
    name:string;
    password:string;
    email:string;
    avatar?:string;
}
export interface IActivationToken {
    name:string;
    email:string;
}