<?php
header('Content-Type: application/json');
$activities = [
  ["id"=>1,"date"=>"2026-08-17","category"=>"Web Systems","activity"=>"Submitted Web Systems Laboratory","status"=>"completed","score"=>95],
  ["id"=>2,"date"=>"2026-08-16","category"=>"JavaScript","activity"=>"Completed JavaScript Quiz","status"=>"completed","score"=>92],
  ["id"=>3,"date"=>"2026-08-15","category"=>"Web Systems","activity"=>"New assignment posted","status"=>"pending","score"=>null],
  ["id"=>4,"date"=>"2026-08-14","category"=>"Database","activity"=>"Database activity due soon","status"=>"pending","score"=>null]
];
echo json_encode(["success"=>true,"data"=>$activities]);
?>
