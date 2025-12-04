export const Siteroutes={

// # Means there is no link Yet. If there is a # and you make a page make sure this is added for the new page to the App.jsx file  " <Route path={Siteroutes.PAGENAME} element={<PAGENAME />} /> "


    //Main Routes
    Home:"/", //Goes to Home Page
    Roomate:"/Roomates", //Goes to Find Roomates page
    House:"/Houses", //Goes to Find Houses page
    LoginSignup:"/Login", //Goes to login Page
    HouseDetail: "/HouseDetail",
    RoommateDetail: "/RoommateDetail",


    //User Profile Nav
     DashBoard:"/Dashboard",
     Profile:"/Profile", //Goes to Profile Page


    //HousePost
    HousePost:"/PostLease",

    //RoomatePost
    RoomatePost: "/RoomatePost",

}