import { createBrowserRouter } from "react-router";

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
