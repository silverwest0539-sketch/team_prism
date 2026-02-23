const scrapService = require('../services/scrap.service');

exports.getScraps = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: "이메일이 필요합니다." });

  try {
    const scraps = await scrapService.getScrapsByUser(email);
    res.json({ success: true, scraps });
  } catch (error) {
    console.error("스크랩 조회 에러:", error);
    res.status(500).json({ success: false, message: "스크랩 조회 실패" });
  }
};

exports.addScrap = async (req, res) => {
  const { email, keyword } = req.body;
  try {
    await scrapService.addScrap(email, keyword);
    res.json({ success: true, message: "스크랩 저장 완료" });
  } catch (error) {
    console.error("스크랩 추가 에러:", error);
    res.status(500).json({ success: false, message: "스크랩 추가 실패" });
  }
};

exports.deleteScrap = async (req, res) => {
  const { email, keyword } = req.query;
  try {
    await scrapService.deleteScrap(email, keyword);
    res.json({ success: true, message: "스크랩 삭제 완료" });
  } catch (error) {
    console.error("스크랩 삭제 에러:", error);
    res.status(500).json({ success: false, message: "스크랩 삭제 실패" });
  }
};

exports.checkScrap = async (req, res) => {
  const { email, keyword } = req.query;
  try {
    const isBookmarked = await scrapService.checkScrap(email, keyword);
    res.json({ success: true, isBookmarked });
  } catch (error) {
    console.error("스크랩 여부 확인 에러:", error);
    res.status(500).json({ success: false, isBookmarked: false });
  }
};