import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Landing from "@/features/landing/Landing";
import EmployerHome from "@/features/employer/EmployerHome";
import CreateCard from "@/features/employer/CreateCard";
import ReviewEdit from "@/features/employer/ReviewEdit";
import WorkerHome from "@/features/worker/WorkerHome";
import StepRunner from "@/features/worker/StepRunner";
import Insights from "@/features/insights/Insights";
import Demo from "@/features/demo/Demo";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/employer" element={<EmployerHome />} />
          <Route path="/employer/:businessId/create" element={<CreateCard />} />
          <Route path="/employer/card/:cardId" element={<ReviewEdit />} />
          <Route path="/work" element={<WorkerHome />} />
          <Route path="/work/:cardId" element={<StepRunner />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/:cardId" element={<Insights />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
