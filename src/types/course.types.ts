export interface ICourseRegistration{
    title:string;
    description:string;
    thumbnail:string;
    category:string;
    price:number;
    courseCreator:string;


}

export interface ILectureUpload {
    title: string;
    description: string;
    lectureVideo: Express.Multer.File;
}

export interface ICourseSection {
    title: string;
    description: string;
    courseId:string;
}
