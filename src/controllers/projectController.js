exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: ["assigned_employees"],
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    let {
      project_name,
      description,
      client_name,
      budget,
      status,
      progress,
      assigned_employees,
    } = req.body;

    /* ================= STATUS ↔ PROGRESS ================= */

    if (status === "Not Started") {
      progress = 0;
    }

    if (status === "Ongoing") {
      if (progress <= 0 || progress >= 100) {
        progress = 10; // default ongoing progress
      }
    }

    if (status === "Completed") {
      progress = 100;
      project.end_date = new Date(); // auto end date
    }

    /* ================= START DATE ================= */

    if (!project.start_date) {
      project.start_date = project.created_at;
    }

    /* ================= UPDATE PROJECT ================= */

    await project.update({
      project_name,
      description,
      client_name,
      budget,
      status,
      progress,
    });

    /* ================= EMPLOYEE ASSIGNMENT ================= */

    if (Array.isArray(assigned_employees)) {
      // remove existing
      await ProjectEmployee.destroy({
        where: { project_id: project.id },
      });

      // add unique employees only
      const uniqueEmployees = [...new Set(assigned_employees)];

      for (const empId of uniqueEmployees) {
        await ProjectEmployee.create({
          project_id: project.id,
          employee_id: empId,
        });
      }
    }

    res.json({
      message: "Project updated successfully",
      project,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};