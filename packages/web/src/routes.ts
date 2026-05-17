import { createBrowserRouter } from "react-router";
import { LockersView } from "./views/Lockers";
import { MembersView } from "./views/Members";
import { DisciplinesView } from './views/Disciplines';
import { HomeView } from "./views/Home";
import { SportsView } from "./views/Sports";
import { EquipmentLoansView } from "./views/EquipmentLoans";
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/lockers",
        Component: LockersView,
      },
      {
        path: "/disciplines",
        Component: DisciplinesView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
      {
        path: "/equipment-loans",
        Component: EquipmentLoansView,
      },
    ],
  },
]);