export const getStats = async(req, res) => {
    const { id, role } = req.user;
    try {
        const filter = role === 'admin' ? {} : { where: { assigned_to: id } };

        const stats = await Document.findAll({
            ...filter,
            attributes: ['status', [fn('COUNT', col('id')), 'total']],
            group: 'status'
        });

        res.json({
            role_scope: role, data:stats
        });
    } catch (error) {
        res.status(500).json({ message: "Error al generar reporte" });
    }
};

     